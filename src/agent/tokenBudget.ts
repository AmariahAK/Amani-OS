import { encode } from "gpt-tokenizer";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { Message } from "@mariozechner/pi-ai";

export function countTextTokens(text: string): number {
  try {
    return encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

export function countMessagesTokens(
  messages: AgentMessage[] | Message[],
  systemPrompt: string,
): number {
  let total = countTextTokens(systemPrompt);
  for (const m of messages) {
    if ("content" in m) {
      const c = m.content;
      if (typeof c === "string") total += countTextTokens(c);
      else if (Array.isArray(c)) {
        for (const block of c) {
          if (typeof block === "object" && block && "text" in block) {
            total += countTextTokens(String((block as { text: string }).text));
          }
        }
      }
    }
    if ("toolResult" in m && m.toolResult) {
      total += countTextTokens(JSON.stringify(m.toolResult));
    }
  }
  return total;
}

export type BudgetLevel = "ok" | "warn" | "force";

export function getBudgetLevel(
  tokens: number,
  contextWindow: number,
): BudgetLevel {
  const ratio = tokens / contextWindow;
  if (ratio >= 0.9) return "force";
  if (ratio >= 0.75) return "warn";
  return "ok";
}

export function formatBudgetMessage(level: BudgetLevel, tokens: number, max: number): string | null {
  const pct = Math.round((tokens / max) * 100);
  if (level === "force") {
    return `[System] Context at ${pct}% (${tokens}/${max} tokens). You MUST call compress_context before continuing.`;
  }
  if (level === "warn") {
    return `[System] Context at ${pct}% (${tokens}/${max} tokens). Consider calling compress_context soon.`;
  }
  return null;
}
