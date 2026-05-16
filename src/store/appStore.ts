import { create } from "zustand";
import type { Agent } from "@mariozechner/pi-agent-core";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import {
  createSession,
  deleteSession,
  getActiveSessionId,
  getAllSessions,
  getSession,
  setActiveSession,
  updateSession,
  backfillSessionTitles,
  type ChatSession,
} from "../storage/chatSessions";
import {
  createAmaniAgent,
  runPromptWithBudget,
  updateAgentModel,
  type AgentCallbacks,
} from "../agent/createAgent";
import {
  hasApiKeyForProvider,
  isAppConfigured,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "../storage/settings";
import { PROVIDER_LABELS } from "../constants/providers";
import { buildSystemPrompt } from "../agent/systemPrompt";
import { titleFromMessages } from "../utils/sessionTitle";
import type { MessageAttachment, SessionAttachments } from "../types/attachments";
import { DOCUMENT_CONTEXT_HEADER, extractDocumentText } from "../lib/extractDocument";
import { inferMimeType } from "../utils/messageDisplay";

const SUGGESTED = [
  "Grace missed her contribution in Jan, what is the penalty?",
  "Brian claims he doesn't owe any penalty. What do the bylaws say?",
];

interface AppState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: AgentMessage[];
  streaming: boolean;
  compressing: boolean;
  budgetWarning: string | null;
  streamError: string | null;
  activeTool: string | null;
  streamPhase: "idle" | "streaming" | "tools" | "continuing";
  toast: string | null;
  settingsOpen: boolean;
  settingsHint: string | null;
  historyOpen: boolean;
  agent: Agent | null;
  draft: string;
  pendingAttachment: MessageAttachment | null;
  pendingAttachBind: MessageAttachment | null;
  sessionAttachments: SessionAttachments;
  init: () => void;
  newChat: () => void;
  loadSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  deleteSessionById: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  editUserMessage: (messageIndex: number, newText: string) => Promise<void>;
  setDraft: (d: string) => void;
  setSettingsOpen: (o: boolean) => void;
  setSettingsHint: (hint: string | null) => void;
  clearStreamError: () => void;
  setHistoryOpen: (o: boolean) => void;
  applySettings: (s: AppSettings) => void;
  setPendingAttachment: (a: AppState["pendingAttachment"]) => void;
  showToast: (message: string) => void;
  suggestedPrompts: string[];
}

let toastHideTimer: ReturnType<typeof setTimeout> | undefined;

function persistSession(
  sessionId: string,
  messages: AgentMessage[],
  attachments: SessionAttachments,
  title?: string,
) {
  updateSession(sessionId, { messages, attachments, ...(title ? { title } : {}) });
}

export const useAppStore = create<AppState>((set, get) => {
  const agentCallbacks: AgentCallbacks = {
    onMessagesChange: (messages) => {
      const { activeSessionId, pendingAttachBind } = get();
      let attachments = { ...get().sessionAttachments };

      if (activeSessionId && pendingAttachBind) {
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          attachments[String(lastUser.timestamp)] = pendingAttachBind;
          set({ pendingAttachBind: null, sessionAttachments: attachments });
        }
      }

      set({ messages });
      if (activeSessionId) {
        persistSession(activeSessionId, messages, attachments);
        const session = getSession(activeSessionId);
        if (session && session.title === "New dispute") {
          const title = titleFromMessages(messages);
          if (title) {
            updateSession(activeSessionId, { title, messages, attachments });
            set({ sessions: getAllSessions() });
          }
        }
      }
    },
    onStreamingChange: (streaming) =>
      set({ streaming, streamPhase: streaming ? get().streamPhase : "idle" }),
    onCompressingChange: (compressing) => set({ compressing }),
    onBudgetWarning: (budgetWarning) => set({ budgetWarning }),
    onError: (streamError) => {
      const settings = loadSettings();
      const label = PROVIDER_LABELS[settings.provider] ?? settings.provider;
      set({
        streamError: `${streamError} (${label} / ${settings.modelId})`,
        streaming: false,
        activeTool: null,
        streamPhase: "idle",
      });
    },
    onToolStart: (activeTool) => set({ activeTool, streamPhase: "tools" }),
    onToolEnd: () => set({ activeTool: null }),
    onStreamPhase: (streamPhase) => set({ streamPhase }),
  };

  return {
    sessions: [],
    activeSessionId: null,
    messages: [],
    streaming: false,
    compressing: false,
    budgetWarning: null,
    streamError: null,
    activeTool: null,
    streamPhase: "idle",
    toast: null,
    settingsOpen: false,
    settingsHint: null,
    historyOpen: false,
    agent: null,
    draft: "",
    pendingAttachment: null,
    pendingAttachBind: null,
    sessionAttachments: {},
    suggestedPrompts: SUGGESTED,

    init: () => {
      backfillSessionTitles(titleFromMessages);
      let sessions = getAllSessions();
      let activeId = getActiveSessionId();
      if (!sessions.length) {
        const s = createSession();
        sessions = getAllSessions();
        activeId = s.id;
      } else if (!activeId || !getSession(activeId)) {
        activeId = sessions[0].id;
        setActiveSession(activeId);
      }
      const active = getSession(activeId!)!;
      const agent = createAmaniAgent(agentCallbacks);
      agent.state.messages = active.messages;
      const settings = loadSettings();
      updateAgentModel(agent, settings.provider, settings.modelId);
      agent.state.thinkingLevel = settings.thinkingLevel;
      set({
        sessions,
        activeSessionId: activeId,
        messages: active.messages,
        sessionAttachments: active.attachments ?? {},
        agent,
        settingsOpen: !isAppConfigured(),
        settingsHint: !isAppConfigured()
          ? "Add your provider API key and model to start arbitrating disputes."
          : null,
      });
    },

    newChat: () => {
      const s = createSession();
      const agent = get().agent;
      if (agent) agent.state.messages = [];
      set({
        sessions: getAllSessions(),
        activeSessionId: s.id,
        messages: [],
        sessionAttachments: {},
        draft: "",
        budgetWarning: null,
      });
    },

    loadSession: (id: string) => {
      const session = getSession(id);
      if (!session) return;
      const { agent, streaming, activeSessionId } = get();
      if (streaming) agent?.abort();
      if (activeSessionId && activeSessionId !== id) {
        const current = getSession(activeSessionId);
        if (current) persistSession(activeSessionId, get().messages, get().sessionAttachments);
      }
      setActiveSession(id);
      if (agent) agent.state.messages = session.messages;
      set({
        activeSessionId: id,
        messages: session.messages,
        sessionAttachments: session.attachments ?? {},
        historyOpen: false,
        streaming: false,
        activeTool: null,
        streamError: null,
        streamPhase: "idle",
        sessions: getAllSessions(),
      });
    },

    renameSession: (id, title) => {
      updateSession(id, { title });
      set({ sessions: getAllSessions() });
    },

    deleteSessionById: (id) => {
      deleteSession(id);
      const sessions = getAllSessions();
      const activeId = getActiveSessionId();
      const active = activeId ? getSession(activeId) : null;
      const agent = get().agent;
      if (agent && active) agent.state.messages = active.messages;
      set({
        sessions,
        activeSessionId: activeId,
        messages: active?.messages ?? [],
      });
      if (!sessions.length) get().newChat();
    },

    sendMessage: async (text: string) => {
      const { agent, activeSessionId, pendingAttachment } = get();
      if (!agent || !activeSessionId || !text.trim()) return;

      const settings = loadSettings();
      if (!hasApiKeyForProvider(settings.provider)) {
        const label = PROVIDER_LABELS[settings.provider] ?? settings.provider;
        set({
          settingsOpen: true,
          settingsHint: `Add an API key for ${label}, pick a model, then click Save & start.`,
        });
        return;
      }

      set({ streamError: null });

      let agentPayload = text.trim();
      if (pendingAttachment) {
        const extracted = await extractDocumentText(pendingAttachment);
        const byteSize = Math.floor((pendingAttachment.base64.length * 3) / 4);
        const attach: MessageAttachment = {
          ...pendingAttachment,
          mimeType: inferMimeType(pendingAttachment.fileName, pendingAttachment.mimeType),
          byteSize: byteSize || pendingAttachment.byteSize,
        };
        agentPayload += `${DOCUMENT_CONTEXT_HEADER}File: ${pendingAttachment.fileName}\n\n${extracted.slice(0, 12_000)}`;
        set({ pendingAttachment: null, pendingAttachBind: attach });
      }

      try {
        await runPromptWithBudget(agent, agentPayload, async () => {
          const summaryPrompt = `Compress this chama dispute conversation into at most 10 sentences covering: (1) dispute parties and claims, (2) bylaws cited, (3) transaction findings, (4) open questions. Conversation:\n${JSON.stringify(agent.state.messages.slice(-20))}`;
          await agent.prompt(summaryPrompt);
          const last = agent.state.messages[agent.state.messages.length - 1];
          if (last?.role === "assistant") {
            const summary = last.content
              .filter((c) => c.type === "text")
              .map((c) => c.text)
              .join("");
            agent.state.messages = [
              {
                role: "user",
                content: `[Context summary]\n${summary}`,
                timestamp: Date.now(),
              } as AgentMessage,
            ];
          }
        });
      } catch {
        /* onError callback surfaces message */
      }

      set({ sessions: getAllSessions(), messages: [...agent.state.messages] });
    },

    stopStreaming: () => {
      get().agent?.abort();
      set({ streaming: false });
    },

    editUserMessage: async (messageIndex, newText) => {
      const { agent, activeSessionId } = get();
      if (!agent || !activeSessionId || !newText.trim()) return;
      const settings = loadSettings();
      if (!hasApiKeyForProvider(settings.provider)) {
        const label = PROVIDER_LABELS[settings.provider] ?? settings.provider;
        set({
          settingsOpen: true,
          settingsHint: `Add an API key for ${label} before continuing.`,
        });
        return;
      }
      const msgs = [...agent.state.messages];
      const truncated = msgs.slice(0, messageIndex);
      agent.state.messages = truncated;
      persistSession(activeSessionId, truncated, get().sessionAttachments);
      set({ messages: truncated, streamError: null });
      try {
        await runPromptWithBudget(agent, newText.trim(), async () => {
          set({ compressing: true });
          await agent.prompt(
            "Summarize this dispute in at most 10 sentences for context compression.",
          );
          set({ compressing: false });
        });
      } catch {
        /* onError callback */
      }
      set({ sessions: getAllSessions(), messages: [...agent.state.messages] });
    },

    setDraft: (draft) => set({ draft }),
    setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    setSettingsHint: (settingsHint) => set({ settingsHint }),
    clearStreamError: () => set({ streamError: null }),
    setHistoryOpen: (historyOpen) =>
      set({ historyOpen, ...(historyOpen ? { sessions: getAllSessions() } : {}) }),
    applySettings: (s) => {
      saveSettings(s);
      const agent = get().agent;
      if (agent) {
        updateAgentModel(agent, s.provider, s.modelId);
        agent.state.thinkingLevel = s.thinkingLevel;
        agent.state.systemPrompt = buildSystemPrompt();
        if (agent.state.model?.provider !== s.provider) {
          console.warn(
            `Model provider mismatch after save: expected ${s.provider}, got ${agent.state.model?.provider}`,
          );
        }
      }
    },
    setPendingAttachment: (pendingAttachment) => set({ pendingAttachment }),

    showToast: (message) => {
      set({ toast: message });
      if (toastHideTimer) clearTimeout(toastHideTimer);
      toastHideTimer = setTimeout(() => set({ toast: null }), 2200);
    },
  };
});
