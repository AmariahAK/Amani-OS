import { Loader2, Wrench } from "lucide-react";

interface ToolCall {
  name: string;
  args: unknown;
}

interface Props {
  tools: ToolCall[];
  running?: boolean;
}

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

export function ToolCallBlock({ tools, running }: Props) {
  if (!tools.length) return null;

  return (
    <div className="mb-2 space-y-1.5">
      {tools.map((t, i) => (
        <div
          key={`${t.name}-${i}`}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
        >
          {running ? (
            <Loader2 size={14} className="shrink-0 animate-spin" style={{ color: "var(--color-primary)" }} />
          ) : (
            <Wrench size={14} className="shrink-0" style={{ color: "var(--color-primary)" }} />
          )}
          <span style={{ color: "var(--color-muted)" }}>
            {TOOL_LABELS[t.name] ?? t.name}
            {typeof t.args === "object" && t.args !== null && "query" in t.args && (
              <span className="ml-1 opacity-80">
                — {String((t.args as { query: string }).query).slice(0, 60)}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
