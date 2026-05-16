import { Copy } from "lucide-react";
import { MarkdownMessage } from "../markdown/MarkdownMessage";
import { ArtifactList, stripArtifactBlocks } from "../artifacts/ArtifactPanel";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallBlock } from "./ToolCallBlock";
import type { MergedAssistantContent } from "../../utils/chatTurns";

interface Props {
  content: MergedAssistantContent;
  inProgress: boolean;
  streamPhase: "streaming" | "tools" | "continuing";
  activeToolLabel: string | null;
  onCopy: () => void;
}

export function AssistantTurnBubble({
  content,
  inProgress,
  streamPhase,
  activeToolLabel,
  onCopy,
}: Props) {
  const { text, thinking, toolCalls } = content;
  const isDispute = /##\s*(Ruling|Uamuzi)/i.test(text);
  const toolsRunning = inProgress && streamPhase === "tools";

  if (!text && !thinking && !toolCalls.length && !inProgress) return null;

  return (
    <div className="group mb-4 flex justify-start">
      <div
        className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"
        style={{
          background: "var(--color-surface)",
          color: "var(--color-text)",
          border: isDispute ? "2px solid var(--color-dispute)" : "1px solid var(--color-border)",
        }}
      >
        {thinking && <ThinkingBlock thinking={thinking} />}
        {toolCalls.length > 0 && <ToolCallBlock tools={toolCalls} running={toolsRunning} />}
        {text.length > 0 && (
          <>
            <ArtifactList content={text} />
            <MarkdownMessage content={stripArtifactBlocks(text)} />
          </>
        )}
        {inProgress && (
          <div
            className="mt-2 flex items-center gap-2 text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
              style={{
                background:
                  streamPhase === "tools" ? "var(--color-clause)" : "var(--color-primary)",
              }}
            />
            {streamPhase === "tools" && activeToolLabel
              ? `${activeToolLabel}…`
              : streamPhase === "continuing"
                ? "Preparing response…"
                : "Arbitrating…"}
          </div>
        )}
        <div className="mt-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onCopy}
            className="rounded p-1 hover:bg-black/10"
            title="Copy"
            aria-label="Copy"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
