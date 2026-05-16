import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage } from "@mariozechner/pi-ai";

export interface Exchange {
  id: string;
  user?: AgentMessage;
  assistant?: AgentMessage;
}

/** Extract plain text from user or assistant message content blocks. */
export function getMessageText(m: AgentMessage): string {
  if (m.role === "user") {
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) {
      return m.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("");
    }
    return "";
  }
  if (m.role === "assistant") {
    const am = m as AssistantMessage;
    return am.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  }
  return "";
}

export function getAssistantToolCalls(m: AgentMessage): { name: string; args: unknown }[] {
  if (m.role !== "assistant") return [];
  const am = m as AssistantMessage;
  return am.content
    .filter((b) => b.type === "toolCall")
    .map((b) => ({ name: b.name, args: b.arguments }));
}

export function messagesToExchanges(messages: AgentMessage[]): Exchange[] {
  const exchanges: Exchange[] = [];
  let current: Exchange | null = null;

  for (const m of messages) {
    if (m.role === "user") {
      if (current) exchanges.push(current);
      current = { id: `ex-${m.timestamp}`, user: m };
    } else if (m.role === "assistant") {
      if (current) {
        current.assistant = m;
        exchanges.push(current);
        current = null;
      } else {
        exchanges.push({ id: `ex-${m.timestamp}`, assistant: m });
      }
    }
  }
  if (current) exchanges.push(current);

  return exchanges;
}

/** User + assistant messages in order (skips toolResult), for chat display. */
export function getChatMessages(messages: AgentMessage[], limit = 30): AgentMessage[] {
  return messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-limit);
}

export function getVisibleExchanges(messages: AgentMessage[], limit = 7): Exchange[] {
  return messagesToExchanges(messages).slice(-limit);
}

export function getThinkingText(m: AgentMessage): string | null {
  if (m.role !== "assistant") return null;
  const am = m as AssistantMessage;
  const thinkingBlocks = am.content.filter((b) => b.type === "thinking");
  if (thinkingBlocks.length) {
    return thinkingBlocks.map((b) => ("thinking" in b ? b.thinking : "")).join("\n");
  }
  const text = getMessageText(m);
  const match = text.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  return match ? match[1].trim() : null;
}

export function getVisibleAssistantText(m: AgentMessage): string {
  let text = getMessageText(m);
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  return text;
}

export function hasMessageContent(m: AgentMessage): boolean {
  if (m.role === "user") return Boolean(getMessageText(m).trim());
  if (m.role === "assistant") {
    return Boolean(getVisibleAssistantText(m)) || getAssistantToolCalls(m).length > 0;
  }
  return false;
}
