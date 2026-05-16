import { useEffect, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "../../lib/pdfWorker";

interface Props {
  base64: string;
  /** Max pages to render in the inline preview */
  maxPages?: number;
}

interface PageImage {
  page: number;
  src: string;
}

export function PdfPreview({ base64, maxPages = 2 }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;

        setTotalPages(doc.numPages);
        const count = Math.min(doc.numPages, maxPages);
        const images: PageImage[] = [];

        for (let p = 1; p <= count; p++) {
          const page = await doc.getPage(p);
          if (cancelled) return;

          const containerWidth = 520;
          const viewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / viewport.width;
          const scaled = page.getViewport({ scale: scale * 1.1 });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = scaled.width;
          canvas.height = scaled.height;

          await page.render({ canvas, canvasContext: ctx, viewport: scaled }).promise;
          if (cancelled) return;

          images.push({ page: p, src: canvas.toDataURL("image/png") });
        }

        setPages(images);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [base64, maxPages]);

  if (loading) {
    return (
      <p className="py-8 text-center text-xs" style={{ color: "var(--color-muted)" }}>
        Loading preview…
      </p>
    );
  }

  if (error) {
    return (
      <p className="py-4 text-center text-xs" style={{ color: "var(--color-muted)" }}>
        Preview unavailable ({error}). Use Download to open the file.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {pages.map(({ page, src }) => (
        <img
          key={page}
          src={src}
          alt={`Page ${page}`}
          className="mx-auto block w-full rounded border"
          style={{ borderColor: "var(--color-border)", background: "#fff" }}
        />
      ))}
      {totalPages > maxPages && (
        <p className="text-center text-xs" style={{ color: "var(--color-muted)" }}>
          Showing first {maxPages} of {totalPages} pages — download for the full PDF.
        </p>
      )}
    </div>
  );
}
