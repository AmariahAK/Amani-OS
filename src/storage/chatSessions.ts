import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { SessionAttachments } from "../types/attachments";

const STORAGE_KEY = "amani-os:sessions:v1";
const ACTIVE_KEY = "amani-os:active-session";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AgentMessage[];
  attachments?: SessionAttachments;
  model?: { provider: string; modelId: string };
}

interface SessionStore {
  sessions: ChatSession[];
  activeId: string | null;
}

function loadStore(): SessionStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return { sessions: [], activeId };
    const sessions = JSON.parse(raw) as ChatSession[];
    return { sessions, activeId };
  } catch {
    return { sessions: [], activeId: null };
  }
}

function saveStore(store: SessionStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store.sessions));
  if (store.activeId) {
    localStorage.setItem(ACTIVE_KEY, store.activeId);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getAllSessions(): ChatSession[] {
  return loadStore()
    .sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Backfill titles for sessions that still use the default name but have messages. */
export function backfillSessionTitles(
  titleFromMessages: (messages: ChatSession["messages"]) => string | null,
): void {
  const store = loadStore();
  let changed = false;
  for (const session of store.sessions) {
    if (session.title !== "New dispute") continue;
    const title = titleFromMessages(session.messages);
    if (title) {
      session.title = title;
      session.updatedAt = Date.now();
      changed = true;
    }
  }
  if (changed) saveStore(store);
}

export function getActiveSessionId(): string | null {
  return loadStore().activeId;
}

export function getSession(id: string): ChatSession | undefined {
  return loadStore().sessions.find((s) => s.id === id);
}

export function setActiveSession(id: string): void {
  const store = loadStore();
  store.activeId = id;
  saveStore(store);
}

export function createSession(): ChatSession {
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: "New dispute",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
  const store = loadStore();
  store.sessions.unshift(session);
  store.activeId = session.id;
  saveStore(store);
  return session;
}

export function updateSession(
  id: string,
  patch: Partial<Pick<ChatSession, "title" | "messages" | "attachments" | "model">>,
): ChatSession | undefined {
  const store = loadStore();
  const idx = store.sessions.findIndex((s) => s.id === id);
  if (idx < 0) return undefined;
  store.sessions[idx] = {
    ...store.sessions[idx],
    ...patch,
    updatedAt: Date.now(),
  };
  saveStore(store);
  return store.sessions[idx];
}

export function deleteSession(id: string): void {
  const store = loadStore();
  store.sessions = store.sessions.filter((s) => s.id !== id);
  if (store.activeId === id) {
    store.activeId = store.sessions[0]?.id ?? null;
  }
  saveStore(store);
}

export function getStorageSizeBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("amani-os:")) {
      total += (localStorage.getItem(key)?.length ?? 0) * 2;
    }
  }
  return total;
}
