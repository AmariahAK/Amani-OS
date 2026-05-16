import { Type } from "typebox";
import type { AgentTool, AgentMessage } from "@mariozechner/pi-agent-core";
import {
  countMessagesTokens,
  formatBudgetMessage,
  getBudgetLevel,
} from "../agent/tokenBudget";
import { textResult } from "./helpers";

export interface TokenToolContext {
  getMessages: () => AgentMessage[];
  getSystemPrompt: () => string;
  getContextWindow: () => number;
  compress: (summary: string) => void;
}

const emptySchema = Type.Object({});

export function createCountTokensTool(ctx: TokenToolContext): AgentTool<typeof emptySchema> {
  return {
    label: "Count tokens",
    name: "count_tokens",
    description: "Return current conversation token count and context budget percentage.",
    parameters: emptySchema,
    execute: async () => {
      const messages = ctx.getMessages();
      const system = ctx.getSystemPrompt();
      const max = ctx.getContextWindow();
      const tokens = countMessagesTokens(messages, system);
      const level = getBudgetLevel(tokens, max);
      const pct = Math.round((tokens / max) * 100);
      return textResult(
        JSON.stringify(
          {
            tokens,
            maxTokens: max,
            percentUsed: pct,
            level,
            hint: formatBudgetMessage(level, tokens, max),
          },
          null,
          2,
        ),
      );
    },
  };
}

const compressSchema = Type.Object({
  summary: Type.String({
    description: "Structured compression summary per skill guidelines (max ~10 sentences)",
  }),
});

export function createCompressContextTool(ctx: TokenToolContext): AgentTool<typeof compressSchema> {
  return {
    label: "Compress context",
    name: "compress_context",
    description:
      "Replace older messages with a structured summary: dispute, bylaws cited, transactions, open questions.",
    parameters: compressSchema,
    execute: async (_id, args) => {
      ctx.compress(args.summary);
      return textResult(
        JSON.stringify({
          ok: true,
          message: "Context compressed. Continue the dispute from the summary.",
        }),
      );
    },
  };
}

export function isOversizedToolResult(text: string): boolean {
  const lines = text.split("\n").length;
  return lines > 1500 || text.length > 50_000;
}
