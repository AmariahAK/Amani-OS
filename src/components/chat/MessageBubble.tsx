import { useState } from "react";
import { Copy, Pencil } from "lucide-react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { MarkdownMessage } from "../markdown/MarkdownMessage";
import { ArtifactList, stripArtifactBlocks } from "../artifacts/ArtifactPanel";
import { getMessageText } from "../../utils/exchanges";

interface Props {
  message: AgentMessage;
  role: "user" | "assistant";
  onEdit?: (newText: string) => void;
  onCopy?: () => void;
}

export function MessageBubble({ message, role, onEdit, onCopy }: Props) {
  const raw = getMessageText(message);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(raw);

  if (!raw.trim()) return null;

  const copy = () => onCopy?.();

  return (
    <div className={`group mb-4 flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          role === "user" ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={{
          background: role === "user" ? "var(--color-primary)" : "var(--color-surface)",
          color: role === "user" ? "var(--color-bg)" : "var(--color-text)",
          border: "1px solid var(--color-border)",
        }}
      >
        {editing && role === "user" ? (
          <div>
            <textarea
              className="w-full rounded border p-2 text-sm text-[var(--color-text)]"
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{ background: "var(--color-bg)" }}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded px-3 py-1 text-sm font-medium"
                style={{ background: "var(--color-clause)" }}
                onClick={() => {
                  onEdit?.(editText);
                  setEditing(false);
                }}
              >
                Save
              </button>
              <button type="button" className="text-sm opacity-70" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          raw.trim().length > 0 && (
            <>
              <ArtifactList content={raw} />
              <MarkdownMessage content={stripArtifactBlocks(raw)} />
            </>
          )
        )}
        <div
          className={`mt-2 flex gap-2 ${role === "user" ? "justify-end" : "justify-start"} opacity-0 transition group-hover:opacity-100`}
        >
          <button type="button" onClick={copy} className="rounded p-1 hover:bg-black/10" title="Copy" aria-label="Copy">
            <Copy size={16} />
          </button>
          {role === "user" && onEdit && (
            <button
              type="button"
              onClick={() => {
                setEditText(raw);
                setEditing(true);
              }}
              className="rounded p-1 hover:bg-black/10"
              title="Edit"
              aria-label="Edit"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
