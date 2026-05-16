import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // pi-ai: `import { parse } from "partial-json"` — package is CJS-only
      {
        find: /^partial-json$/,
        replacement: path.resolve(__dirname, "src/shims/partial-json.ts"),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["@mariozechner/pi-agent-core"],
  },
});
