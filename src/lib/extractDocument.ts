import { extractPdfText } from "../tools/documentTools";

/** Text sent to the LLM only — not shown in the chat bubble. */
export const DOCUMENT_CONTEXT_HEADER = "\n\n---\n[Document for the agent — not shown in chat UI]\n";

export async function extractDocumentText(file: {
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<string> {
  const lower = file.fileName.toLowerCase();

  if (lower.endsWith(".md") || lower.endsWith(".txt")) {
    try {
      return atob(file.base64).slice(0, 100_000);
    } catch {
      return "(Could not decode text file.)";
    }
  }

  if (lower.endsWith(".pdf")) {
    try {
      const text = await extractPdfText(file.base64);
      if (text.trim().length > 50) return text;
      return "(PDF has little extractable text — it may be scanned or image-based.)";
    } catch (e) {
      return `(PDF read error: ${e instanceof Error ? e.message : String(e)})`;
    }
  }

  return "(Unsupported file type. Use .pdf, .md, or .txt.)";
}
