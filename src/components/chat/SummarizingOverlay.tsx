export function SummarizingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="rounded-2xl px-8 py-6 text-center shadow-xl"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: "var(--color-clause)", borderTopColor: "transparent" }}
          />
        </div>
        <p className="text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
          Summarizing context…
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Compressing dispute history, transactions, and rulings
        </p>
      </div>
    </div>
  );
}
