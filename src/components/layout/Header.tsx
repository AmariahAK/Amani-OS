import { Settings } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function Header() {
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const budgetWarning = useAppStore((s) => s.budgetWarning);

  return (
    <header
      className="flex items-center justify-between border-b px-6 py-4"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-primary)",
        color: "var(--color-bg)",
      }}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Amani OS</h1>
        <p className="text-sm opacity-85">Chama Dispute Arbitrator</p>
      </div>
      <div className="flex items-center gap-3">
        {budgetWarning && (
          <span className="max-w-xs truncate rounded-full bg-[var(--color-clause)] px-3 py-1 text-xs font-medium text-[var(--color-text)]">
            {budgetWarning.slice(0, 60)}…
          </span>
        )}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="rounded-lg p-2 transition hover:bg-white/15"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={22} />
        </button>
      </div>
    </header>
  );
}
