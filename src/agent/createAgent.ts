import { Agent, type AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage } from "@mariozechner/pi-ai";
import { getModel } from "@mariozechner/pi-ai";
import type { Api, Model } from "@mariozechner/pi-ai";
import { createStreamFn } from "@mariozechner/pi-web-ui";
import { buildSystemPrompt } from "./systemPrompt";
import { countMessagesTokens, formatBudgetMessage, getBudgetLevel } from "./tokenBudget";
import {
  getMemberRegisterTool,
  queryTransactionsTool,
  searchBylawsTool,
  getCurrentDatetimeTool,
} from "../tools/chamaTools";
import { readDocumentTool, webSearchTool } from "../tools/documentTools";
import { createCompressContextTool, createCountTokensTool } from "../tools/tokenTools";
import { loadSettings, getApiKey } from "../storage/settings";

const TOOL_LABELS: Record<string, string> = {
  search_bylaws: "Searching bylaws",
  query_transactions: "Querying M-Pesa records",
  get_member_register: "Loading member register",
  get_current_datetime: "Checking date/time",
  read_document: "Reading document",
  web_search: "Searching the web",
  count_tokens: "Counting tokens",
  compress_context: "Compressing context",
};

export interface AgentCallbacks {
  onMessagesChange: (messages: AgentMessage[]) => void;
  onStreamingChange: (streaming: boolean) => void;
  onCompressingChange: (compressing: boolean) => void;
  onBudgetWarning: (message: string | null) => void;
  onError: (message: string) => void;
  onToolStart?: (toolName: string) => void;
  onToolEnd?: () => void;
  onStreamPhase?: (phase: "streaming" | "tools" | "continuing") => void;
}

function extractAgentError(agent: Agent): string | null {
  if (agent.state.errorMessage) return agent.state.errorMessage;

  const msgs = agent.state.messages;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.role === "assistant") {
      const am = m as AssistantMessage;
      if (am.stopReason === "error" || am.stopReason === "aborted") {
        return am.errorMessage ?? `Model stopped (${am.stopReason})`;
      }
      break;
    }
  }
  return null;
}

let agentInstance: Agent | null = null;
let callbacks: AgentCallbacks | null = null;

const pickModel = (provider: string, modelId: string): Model<Api> =>
  (getModel as (p: string, m: string) => Model<Api>)(provider, modelId);

function getProxyUrl(): string | undefined {
  const s = loadSettings();
  if (s.proxyEnabled && s.proxyUrl) return s.proxyUrl;
  return undefined;
}

export function createAmaniAgent(cb: AgentCallbacks): Agent {
  callbacks = cb;
  const settings = loadSettings();
  let model: Model<Api>;
  try {
    model = pickModel(settings.provider, settings.modelId);
  } catch {
    model = getModel("google", "gemini-2.0-flash");
  }

  const systemPrompt = buildSystemPrompt();
  let messages: AgentMessage[] = [];

  const tokenCtx = {
    getMessages: () => messages,
    getSystemPrompt: () => systemPrompt,
    getContextWindow: () => model.contextWindow ?? 128_000,
    compress: (summary: string) => {
      const compressed: AgentMessage[] = [
        {
          role: "user",
          content: `[Context summary — prior dispute compressed]\n\n${summary}`,
          timestamp: Date.now(),
        },
      ];
      messages = compressed;
      if (agentInstance) agentInstance.state.messages = compressed;
      callbacks?.onMessagesChange([...messages]);
    },
  };

  const tools = [
    searchBylawsTool,
    queryTransactionsTool,
    getMemberRegisterTool,
    getCurrentDatetimeTool,
    readDocumentTool,
    webSearchTool,
    createCountTokensTool(tokenCtx),
    createCompressContextTool(tokenCtx),
  ];

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      thinkingLevel: settings.thinkingLevel,
      messages: [],
      tools,
    },
    getApiKey: (provider) => getApiKey(provider),
    streamFn: createStreamFn(async () => getProxyUrl()),
  });

  agent.subscribe((event) => {
    if (event.type === "message_end" || event.type === "message_update") {
      messages = [...agent.state.messages];
      callbacks?.onMessagesChange(messages);
      if (event.type === "message_update") {
        callbacks?.onStreamPhase?.("streaming");
      }
    }
    if (event.type === "tool_execution_start") {
      callbacks?.onStreamPhase?.("tools");
      callbacks?.onToolStart?.(TOOL_LABELS[event.toolName] ?? event.toolName);
    }
    if (event.type === "tool_execution_end") {
      if (agent.state.pendingToolCalls.size === 0) {
        callbacks?.onStreamPhase?.("continuing");
        callbacks?.onToolEnd?.();
      }
    }
    if (event.type === "agent_start") {
      callbacks?.onStreamingChange(true);
      callbacks?.onStreamPhase?.("streaming");
      callbacks?.onToolEnd?.();
    }
    if (event.type === "agent_end") {
      callbacks?.onStreamingChange(false);
      callbacks?.onToolEnd?.();
      const err = extractAgentError(agent);
      if (err) callbacks?.onError(err);
      checkToolOutputSize(agent);
      checkTokenBudget(agent, systemPrompt);
    }
  });

  agentInstance = agent;
  return agent;
}

function checkTokenBudget(agent: Agent, systemPrompt: string): void {
  const model = agent.state.model;
  const max = model?.contextWindow ?? 128_000;
  const tokens = countMessagesTokens(agent.state.messages, systemPrompt);
  const level = getBudgetLevel(tokens, max);
  callbacks?.onBudgetWarning(formatBudgetMessage(level, tokens, max));
}

function checkToolOutputSize(agent: Agent): void {
  const msgs = agent.state.messages;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.role === "toolResult") {
      const text = m.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
      if (text.split("\n").length > 1500 || text.length > 50_000) {
        agent.state.messages = [
          ...msgs,
          {
            role: "user",
            content:
              "[System] The last tool output was very large. Summarize its key findings in ≤15 lines before your next reply.",
            timestamp: Date.now(),
          },
        ];
        break;
      }
    }
  }
}

export async function ensureApiKey(provider: string): Promise<boolean> {
  return Boolean(getApiKey(provider));
}

export function updateAgentModel(agent: Agent, provider: string, modelId: string): void {
  try {
    agent.state.model = pickModel(provider, modelId);
  } catch (e) {
    console.error("Invalid model", e);
  }
}

export async function runPromptWithBudget(
  agent: Agent,
  text: string,
  forceCompress: () => Promise<void>,
): Promise<void> {
  const systemPrompt = buildSystemPrompt();
  const max = agent.state.model?.contextWindow ?? 128_000;
  const tokens = countMessagesTokens(agent.state.messages, systemPrompt);
  const level = getBudgetLevel(tokens, max);

  if (level === "force") {
    callbacks?.onCompressingChange(true);
    await forceCompress();
    callbacks?.onCompressingChange(false);
  }

  try {
    await agent.prompt(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    callbacks?.onError(msg);
    throw e;
  }
}

export function getAgent(): Agent | null {
  return agentInstance;
}
