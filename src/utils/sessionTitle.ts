import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { getMessageText } from "./exchanges";

export function autoTitle(text: string): string {
  const t = text.trim().slice(0, 48);
  return t.length < text.trim().length ? `${t}…` : t || "New dispute";
}

export function titleFromMessages(messages: AgentMessage[]): string | null {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return null;
  const text = getMessageText(firstUser).trim();
  return text ? autoTitle(text) : null;
}

export function getSessionDisplayTitle(storedTitle: string, messages: AgentMessage[]): string {
  if (storedTitle !== "New dispute") return storedTitle;
  return titleFromMessages(messages) ?? storedTitle;
}
