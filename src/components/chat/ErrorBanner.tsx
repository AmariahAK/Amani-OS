import { X } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function ErrorBanner() {
  const streamError = useAppStore((s) => s.streamError);
  const clearStreamError = useAppStore((s) => s.clearStreamError);

  if (!streamError) return null;

  return (
    <div
      className="mx-auto mb-3 max-w-2xl rounded-xl border-2 px-4 py-3"
      style={{ borderColor: "var(--color-dispute)", background: "var(--color-surface)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--color-dispute)" }}>
            Request failed
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
            {streamError}
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
            Try another model from your provider in Setup.
          </p>
        </div>
        <button
          type="button"
          onClick={clearStreamError}
          className="shrink-0 rounded p-1 hover:bg-black/5"
          aria-label="Dismiss error"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
