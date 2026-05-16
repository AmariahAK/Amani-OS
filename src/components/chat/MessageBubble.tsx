import { useState } from "react";
import { Copy, Pencil } from "lucide-react";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import { MarkdownMessage } from "../markdown/MarkdownMessage";
import { ArtifactList, stripArtifactBlocks } from "../artifacts/ArtifactPanel";
import { AttachmentCard } from "./AttachmentCard";
import { getVisibleAssistantText } from "../../utils/exchanges";
import { getUserMessageDisplay } from "../../utils/messageDisplay";
import type { SessionAttachments } from "../../types/attachments";

interface Props {
  message: AgentMessage;
  role: "user" | "assistant";
  sessionAttachments?: SessionAttachments;
  onEdit?: (newText: string) => void;
  onCopy?: () => void;
}

export function MessageBubble({ message, role, sessionAttachments = {}, onEdit, onCopy }: Props) {
  const isUser = role === "user";
  const { visibleText, attachment } = isUser
    ? getUserMessageDisplay(message, sessionAttachments)
    : { visibleText: getVisibleAssistantText(message), attachment: null };

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(visibleText);

  if (!visibleText.trim() && !attachment) return null;

  const copy = () => onCopy?.();

  const isDispute = !isUser && /##\s*(Ruling|Uamuzi)/i.test(visibleText);

  return (
    <div className={`group mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={{
          background: isUser ? "var(--color-primary)" : "var(--color-surface)",
          color: isUser ? "var(--color-bg)" : "var(--color-text)",
          border: isDispute ? "2px solid var(--color-dispute)" : "1px solid var(--color-border)",
        }}
      >
        {editing && isUser ? (
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
          <>
            {visibleText.trim().length > 0 &&
              (isUser ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{visibleText}</p>
              ) : (
                <>
                  <ArtifactList content={visibleText} />
                  <MarkdownMessage content={stripArtifactBlocks(visibleText)} />
                </>
              ))}
            {attachment && <AttachmentCard attachment={attachment} onUserBubble={isUser} />}
          </>
        )}
        <div
          className={`mt-2 flex gap-2 ${isUser ? "justify-end" : "justify-start"} opacity-0 transition group-hover:opacity-100`}
        >
          <button type="button" onClick={copy} className="rounded p-1 hover:bg-black/10" title="Copy" aria-label="Copy">
            <Copy size={16} />
          </button>
          {isUser && onEdit && (
            <button
              type="button"
              onClick={() => {
                setEditText(visibleText);
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
