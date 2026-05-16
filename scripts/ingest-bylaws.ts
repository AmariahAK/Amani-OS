/**
 * Regenerates src/data JSON from docs/amani_chama_bylaws.pdf when pdftotext is available.
 * Run: npm run ingest
 */
import { writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pdfPath = join(root, "docs", "amani_chama_bylaws.pdf");

if (!existsSync(pdfPath)) {
  console.warn("PDF not found at docs/amani_chama_bylaws.pdf — keeping existing JSON.");
  process.exit(0);
}

let text = "";
try {
  text = execSync(`pdftotext "${pdfPath}" -`, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
} catch {
  console.warn("pdftotext not available — keeping existing JSON.");
  process.exit(0);
}

const chunks: { id: string; article: string; title: string; text: string }[] = [];
const articleBlocks = text.split(/(?=ARTICLE \d+)/);
for (const block of articleBlocks) {
  const m = block.match(/^ARTICLE (\d+)[^\n]*\n([\s\S]*?)(?=ARTICLE |\Z)/);
  if (!m) continue;
  const article = m[1];
  const body = m[2].trim().slice(0, 2000);
  if (body.length > 40) {
    chunks.push({
      id: `art-${article}`,
      article,
      title: block.split("\n")[0].replace(/^ARTICLE \d+\s*[-—]\s*/, "").trim(),
      text: body,
    });
  }
}

if (chunks.length) {
  writeFileSync(join(root, "src/data/bylaws_chunks.json"), JSON.stringify(chunks, null, 2));
  console.log(`Wrote ${chunks.length} bylaw chunks`);
}

console.log("Ingest complete (members/transactions use curated mock data in repo).");
