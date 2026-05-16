import { useAppStore } from "../../store/appStore";

export function Toast() {
  const toast = useAppStore((s) => s.toast);

  if (!toast) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-28 left-1/2 z-[60] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2"
      role="status"
      aria-live="polite"
    >
      <div
        className="rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-bg)",
        }}
      >
        {toast}
      </div>
    </div>
  );
}
