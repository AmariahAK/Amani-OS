import { BookOpen, Receipt } from "lucide-react";
import bylawsChunks from "../../data/bylaws_chunks.json";
import transactions from "../../data/transactions.json";

function getRecordsSummary(): string {
  const months = [...new Set((transactions as { month: string }[]).map((t) => t.month))].sort();
  const first = months[0]?.replace(/^\d{4}-/, "") ?? "Jan";
  const last = months[months.length - 1]?.replace(/^\d{4}-/, "") ?? "May";
  const year = months[0]?.slice(0, 4) ?? "2024";
  return `Paybill 247247 • ${first}–${last} ${year}`;
}

export function ChamaContextPanel() {
  const articleCount = (bylawsChunks as unknown[]).length;

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col border-r px-4 py-6 md:flex"
      style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
    >
      <h2
        className="mb-4 text-xs font-bold tracking-widest"
        style={{ color: "var(--color-primary)" }}
      >
        CHAMA CONTEXT
      </h2>

      <div className="space-y-3">
        <ContextCard
          icon={<BookOpen size={22} style={{ color: "var(--color-clause)" }} />}
          label="Bylaws Loaded"
          detail={`${articleCount} articles`}
        />
        <ContextCard
          icon={<Receipt size={22} style={{ color: "var(--color-dispute)" }} />}
          label="Financial Records"
          detail={getRecordsSummary()}
        />
      </div>
    </aside>
  );
}

function ContextCard({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-3 py-3 shadow-sm"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--color-bg)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          {detail}
        </p>
      </div>
    </div>
  );
}
