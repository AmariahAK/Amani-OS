import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export interface TableArtifact {
  type: "table";
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ChartArtifact {
  type: "chart";
  title: string;
  chartType: "bar" | "line";
  data: { name: string; value: number }[];
}

export type Artifact = TableArtifact | ChartArtifact;

const ARTIFACT_RE = /```artifact:(table|chart)\s*\n([\s\S]*?)```/g;

export function parseArtifacts(content: string): { clean: string; artifacts: Artifact[] } {
  const artifacts: Artifact[] = [];
  let clean = content;
  let match: RegExpExecArray | null;
  const re = new RegExp(ARTIFACT_RE);
  while ((match = re.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[2].trim()) as Record<string, unknown>;
      if (match[1] === "table") {
        artifacts.push({
          type: "table",
          title: String(parsed.title ?? "Table"),
          headers: (parsed.headers as string[]) ?? [],
          rows: (parsed.rows as string[][]) ?? [],
        });
      } else {
        artifacts.push({
          type: "chart",
          title: String(parsed.title ?? "Chart"),
          chartType: (parsed.chartType as "bar" | "line") ?? "bar",
          data: (parsed.data as { name: string; value: number }[]) ?? [],
        });
      }
      clean = clean.replace(match[0], "");
    } catch {
      /* skip */
    }
  }
  return { clean: clean.trim(), artifacts };
}

function exportTableXlsx(a: TableArtifact) {
  const ws = XLSX.utils.aoa_to_sheet([a.headers, ...a.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${a.title.replace(/\s+/g, "_")}.xlsx`);
}

function exportTablePdf(a: TableArtifact) {
  const doc = new jsPDF();
  doc.text(a.title, 14, 16);
  autoTable(doc, { head: [a.headers], body: a.rows, startY: 22 });
  doc.save(`${a.title.replace(/\s+/g, "_")}.pdf`);
}

function TableCard({ artifact }: { artifact: TableArtifact }) {
  return (
    <div className="my-4 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">{artifact.title}</h4>
        <div className="flex gap-2">
          <button type="button" onClick={() => exportTableXlsx(artifact)} className="rounded p-1.5 hover:bg-black/5" title="Download Excel" aria-label="Download Excel">
            <FileSpreadsheet size={18} />
          </button>
          <button type="button" onClick={() => exportTablePdf(artifact)} className="rounded p-1.5 hover:bg-black/5" title="Download PDF" aria-label="Download PDF">
            <Download size={18} />
          </button>
        </div>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {artifact.headers.map((h) => (
              <th key={h} className="px-2 py-1 text-left font-medium" style={{ color: "var(--color-primary)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {artifact.rows.map((row, i) => (
            <tr key={i} className="border-t" style={{ borderColor: "var(--color-border)" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({ artifact }: { artifact: ChartArtifact }) {
  const id = useMemo(() => `chart-${artifact.title.replace(/\W/g, "")}`, [artifact.title]);

  const exportPng = async () => {
    const el = document.getElementById(id);
    if (!el) return;
    const dataUrl = await toPng(el);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${artifact.title.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  const exportPdf = async () => {
    const el = document.getElementById(id);
    if (!el) return;
    const dataUrl = await toPng(el);
    const doc = new jsPDF();
    doc.text(artifact.title, 14, 16);
    doc.addImage(dataUrl, "PNG", 14, 24, 180, 100);
    doc.save(`${artifact.title.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="my-4 rounded-lg border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">{artifact.title}</h4>
        <div className="flex gap-2">
          <button type="button" onClick={exportPng} className="rounded p-1.5 hover:bg-black/5" title="Download PNG" aria-label="Download PNG">
            <Download size={18} />
          </button>
          <button type="button" onClick={exportPdf} className="rounded p-1.5 hover:bg-black/5" title="Download chart PDF" aria-label="Download chart PDF">
            <FileSpreadsheet size={18} />
          </button>
        </div>
      </div>
      <div id={id} className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {artifact.chartType === "line" ? (
            <LineChart data={artifact.data}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2D5016" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={artifact.data}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#C1440E" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ArtifactList({ content }: { content: string }) {
  const { artifacts } = parseArtifacts(content);
  if (!artifacts.length) return null;
  return (
    <div className="space-y-2">
      {artifacts.map((a, i) =>
        a.type === "table" ? <TableCard key={i} artifact={a} /> : <ChartCard key={i} artifact={a} />,
      )}
    </div>
  );
}

export function stripArtifactBlocks(content: string): string {
  return parseArtifacts(content).clean;
}
