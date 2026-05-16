import { Type } from "typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import * as pdfjs from "pdfjs-dist";
import "../lib/pdfWorker";
import { textResult } from "./helpers";
import { loadSettings } from "../storage/settings";

export async function extractPdfText(base64: string): Promise<string> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return parts.join("\n\n");
}

const readSchema = Type.Object({
  fileName: Type.String(),
  mimeType: Type.Optional(Type.String()),
  contentBase64: Type.String({ description: "Base64 file content" }),
});

export const readDocumentTool: AgentTool<typeof readSchema> = {
  label: "Read document",
  name: "read_document",
  description:
    "Read uploaded document text. Supports .md, .txt, .pdf (pdfjs with base64 fallback for scanned PDFs).",
  parameters: readSchema,
  execute: async (_id, args) => {
    const { fileName, contentBase64 } = args;
    const lower = fileName.toLowerCase();

    if (lower.endsWith(".md") || lower.endsWith(".txt")) {
      const binary = atob(contentBase64);
      return textResult(binary.slice(0, 100_000));
    }

    if (lower.endsWith(".pdf")) {
      try {
        const text = await extractPdfText(contentBase64);
        if (text.trim().length > 50) {
          return textResult(`Extracted PDF text from ${fileName}:\n\n${text.slice(0, 80_000)}`);
        }
        return textResult(
          `PDF ${fileName} appears scanned or empty via text extraction. Base64 length: ${contentBase64.length}. Ask user for clearer copy.`,
        );
      } catch (e) {
        return textResult(
          `PDF read error for ${fileName}: ${e instanceof Error ? e.message : String(e)}. Base64 provided (${contentBase64.length} chars).`,
        );
      }
    }

    return textResult(`Unsupported file type: ${fileName}. Supported: .md, .txt, .pdf`);
  },
};

const searchSchema = Type.Object({
  query: Type.String(),
});

export const webSearchTool: AgentTool<typeof searchSchema> = {
  label: "Web search",
  name: "web_search",
  description: "Search the web via DuckDuckGo lite HTML (may need CORS proxy).",
  parameters: searchSchema,
  execute: async (_id, args) => {
    const settings = loadSettings();
    const q = encodeURIComponent(args.query);
    const base = `https://lite.duckduckgo.com/lite/?q=${q}`;
    const url =
      settings.proxyEnabled && settings.proxyUrl
        ? `${settings.proxyUrl}${encodeURIComponent(base)}`
        : base;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const snippets = html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);
      return textResult(snippets || "No results parsed. Try rephrasing or enable CORS proxy in Settings.");
    } catch (e) {
      return textResult(
        `Web search failed: ${e instanceof Error ? e.message : String(e)}. Enable CORS proxy in Settings.`,
      );
    }
  },
};
