import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Eye, EyeOff } from "lucide-react";
import type { MessageAttachment } from "../../types/attachments";
import { base64ToBlob, formatFileSize } from "../../utils/messageDisplay";
import { PdfPreview } from "./PdfPreview";

interface Props {
  attachment: MessageAttachment;
  compact?: boolean;
  onUserBubble?: boolean;
}

export function AttachmentCard({ attachment, compact, onUserBubble }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const blobUrl = useMemo(
    () => URL.createObjectURL(base64ToBlob(attachment.base64, attachment.mimeType, attachment.fileName)),
    [attachment.base64, attachment.mimeType, attachment.fileName],
  );

  useEffect(() => () => URL.revokeObjectURL(blobUrl), [blobUrl]);

  const isPdf = attachment.mimeType === "application/pdf" || attachment.fileName.toLowerCase().endsWith(".pdf");
  const sizeLabel = attachment.byteSize != null ? formatFileSize(attachment.byteSize) : null;

  const download = () => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = attachment.fileName;
    a.click();
  };

  return (
    <div
      className={`mt-2 rounded-xl border ${compact ? "px-3 py-2" : "px-3 py-3"}`}
      style={{
        borderColor: onUserBubble ? "rgba(255,255,255,0.35)" : "var(--color-border)",
        background: onUserBubble ? "rgba(0,0,0,0.12)" : "var(--color-bg)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: onUserBubble ? "rgba(255,255,255,0.15)" : "var(--color-surface)" }}
        >
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{attachment.fileName}</p>
          {sizeLabel && <p className="text-xs opacity-80">{sizeLabel}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
              style={{
                background: onUserBubble ? "var(--color-clause)" : "var(--color-primary)",
                color: onUserBubble ? "var(--color-text)" : "var(--color-bg)",
              }}
            >
              <Download size={14} />
              Download
            </button>
            {isPdf && !compact && (
              <button
                type="button"
                onClick={() => setPreviewOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs opacity-90"
                style={{ borderColor: onUserBubble ? "rgba(255,255,255,0.4)" : "var(--color-border)" }}
              >
                {previewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                {previewOpen ? "Hide" : "Preview"}
              </button>
            )}
          </div>
        </div>
      </div>
      {previewOpen && isPdf && (
        <div
          className="mt-3 max-h-96 overflow-y-auto rounded-lg border p-2"
          style={{
            borderColor: onUserBubble ? "rgba(255,255,255,0.35)" : "var(--color-border)",
            background: "#fff",
          }}
        >
          <PdfPreview base64={attachment.base64} maxPages={3} />
        </div>
      )}
    </div>
  );
}
