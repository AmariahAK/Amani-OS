import type { AgentMessage } from "@mariozechner/pi-agent-core";
import {
  getAssistantToolCalls,
  getMessageText,
  getThinkingText,
  getVisibleAssistantText,
} from "./exchanges";

export interface ChatTurn {
  id: string;
  user?: AgentMessage;
  assistants: AgentMessage[];
}

export interface MergedAssistantContent {
  text: string;
  thinking: string | null;
  toolCalls: { name: string; args: unknown }[];
}

/** Group messages into user turns; each turn has one user message and all assistant replies until the next user. */
export function messagesToChatTurns(messages: AgentMessage[], limit = 20): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let current: ChatTurn | null = null;

  for (const m of messages) {
    if (m.role === "user") {
      if (current) turns.push(current);
      current = { id: `turn-${m.timestamp}`, user: m, assistants: [] };
    } else if (m.role === "assistant") {
      if (!current) {
        current = { id: `turn-${m.timestamp}`, assistants: [m] };
      } else {
        current.assistants.push(m);
      }
    }
  }
  if (current) turns.push(current);
  return turns.slice(-limit);
}

/** Remove model-hallucinated raw JSON / bracket tool syntax from visible text. */
export function stripRawToolSyntax(text: string): string {
  return text
    .replace(/\[\s*\{[\s\S]*?"(?:function|name)"\s*:[\s\S]*?\}\s*\]/g, "")
    .replace(/\[\s*\{[\s\S]*?"query"\s*:[\s\S]*?\}\s*\]/g, "")
    .replace(/\[get_[a-z_]+\(\)\]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function mergeAssistantTurn(assistants: AgentMessage[]): MergedAssistantContent {
  const textParts: string[] = [];
  const thinkingParts: string[] = [];
  const toolCalls: { name: string; args: unknown }[] = [];
  const seenTools = new Set<string>();

  for (const m of assistants) {
    const visible = stripRawToolSyntax(getVisibleAssistantText(m));
    if (visible) textParts.push(visible);

    const thinking = getThinkingText(m);
    if (thinking?.trim()) thinkingParts.push(thinking.trim());

    for (const tc of getAssistantToolCalls(m)) {
      const key = `${tc.name}:${JSON.stringify(tc.args)}`;
      if (!seenTools.has(key)) {
        seenTools.add(key);
        toolCalls.push(tc);
      }
    }
  }

  return {
    text: textParts.join("\n\n"),
    thinking: thinkingParts.length ? thinkingParts.join("\n\n") : null,
    toolCalls,
  };
}

export function turnHasContent(turn: ChatTurn): boolean {
  if (turn.user && getMessageText(turn.user).trim()) return true;
  const merged = mergeAssistantTurn(turn.assistants);
  return Boolean(merged.text || merged.thinking || merged.toolCalls.length);
}
