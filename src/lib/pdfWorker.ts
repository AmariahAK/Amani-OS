import { GlobalWorkerOptions } from "pdfjs-dist";

/**
 * pdf.js worker must be served from a stable URL (not a hashed /assets chunk).
 * public/pdf.worker.min.mjs is copied from node_modules on npm run dev/build.
 */
export function configurePdfWorker(): void {
  if (typeof window === "undefined") return;
  const path = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`.replace(/\/+/g, "/");
  GlobalWorkerOptions.workerSrc = new URL(path, window.location.origin).href;
}

configurePdfWorker();
