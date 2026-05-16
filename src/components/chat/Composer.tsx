import { useRef } from "react";
import { Paperclip, Send, Square } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { AttachmentCard } from "./AttachmentCard";
import { inferMimeType } from "../../utils/messageDisplay";
import { loadSettings } from "../../storage/settings";
import { getModel } from "@mariozechner/pi-ai";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getModelDisplayName(): string {
  const s = loadSettings();
  try {
    const m = (getModel as (p: string, id: string) => { name?: string; id: string })(s.provider, s.modelId);
    return m.name || m.id;
  } catch {
    return s.modelId;
  }
}

export function Composer() {
  const draft = useAppStore((s) => s.draft);
  const setDraft = useAppStore((s) => s.setDraft);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const stopStreaming = useAppStore((s) => s.stopStreaming);
  const streaming = useAppStore((s) => s.streaming);
  const pendingAttachment = useAppStore((s) => s.pendingAttachment);
  const setPendingAttachment = useAppStore((s) => s.setPendingAttachment);
  const fileRef = useRef<HTMLInputElement>(null);

  const modelLabel = getModelDisplayName();

  const submit = () => {
    if (!draft.trim() || streaming) return;
    void sendMessage(draft);
    setDraft("");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setPendingAttachment({
      fileName: file.name,
      mimeType: inferMimeType(file.name, file.type),
      base64,
      byteSize: file.size,
    });
    e.target.value = "";
  };

  return (
    <div className="shrink-0 border-t px-4 py-4 md:px-8" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
      <div className="mx-auto max-w-2xl">
        {pendingAttachment && (
          <div className="mb-3">
            <AttachmentCard attachment={pendingAttachment} compact />
            <button
              type="button"
              className="mt-1 text-xs underline opacity-70"
              style={{ color: "var(--color-muted)" }}
              onClick={() => setPendingAttachment(null)}
            >
              Remove attachment
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border px-2 py-2 shadow-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.md,.txt" onChange={onFile} />
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg p-2.5 transition hover:bg-black/5" title="Attach" aria-label="Attach file">
            <Paperclip size={20} />
          </button>
          <textarea
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2.5 text-sm outline-none"
            placeholder="State the dispute or ask a question about the bylaws…"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            type="button"
            onClick={streaming ? stopStreaming : submit}
            disabled={!streaming && !draft.trim()}
            className="rounded-xl p-3 text-white transition disabled:opacity-40"
            style={{ background: streaming ? "var(--color-dispute)" : "var(--color-primary)" }}
            title={streaming ? "Stop" : "Send"}
            aria-label={streaming ? "Stop" : "Send"}
          >
            {streaming ? <Square size={20} fill="currentColor" /> : <Send size={20} />}
          </button>
        </div>
        <p className="mt-3 text-center text-xs" style={{ color: "var(--color-muted)" }}>
          Amani OS uses {modelLabel} • Verify arbitration decisions with humans.
        </p>
      </div>
    </div>
  );
}
