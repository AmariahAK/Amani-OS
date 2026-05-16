import type { AgentToolResult } from "@mariozechner/pi-agent-core";

export function textResult(text: string, details: unknown = {}): AgentToolResult<unknown> {
  return {
    content: [{ type: "text", text }],
    details,
  };
}
