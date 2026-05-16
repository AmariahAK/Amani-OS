import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { MessageAttachment, SessionAttachments } from "../types/attachments";
import { getMessageText } from "./exchanges";
import { DOCUMENT_CONTEXT_HEADER } from "../lib/extractDocument";

/** Remove agent-only document payload from text shown in the chat UI. */
export function stripInternalDocumentContext(text: string): string {
  let out = text;

  const idx = out.indexOf(DOCUMENT_CONTEXT_HEADER);
  if (idx >= 0) out = out.slice(0, idx);

  out = out.replace(/\n\n\[Attached:[^\]]*\][\s\S]*$/i, "");
  out = out.replace(/\n\nExtracted PDF text from[\s\S]*$/i, "");

  return out.trim();
}

export function getUserMessageDisplay(
  message: AgentMessage,
  attachments: SessionAttachments,
): { visibleText: string; attachment: MessageAttachment | null } {
  const full = getMessageText(message);
  const visibleText = stripInternalDocumentContext(full);
  const attachment = attachments[String(message.timestamp)] ?? null;
  return { visibleText, attachment };
}

export function inferMimeType(fileName: string, mimeType?: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".txt")) return "text/plain";
  return mimeType || "application/octet-stream";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function base64ToBlob(base64: string, mimeType: string, fileName?: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const type = fileName ? inferMimeType(fileName, mimeType) : mimeType || "application/octet-stream";
  return new Blob([bytes], { type });
}
