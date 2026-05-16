import { History, Plus } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function Sidebar() {
  const newChat = useAppStore((s) => s.newChat);
  const setHistoryOpen = useAppStore((s) => s.setHistoryOpen);

  return (
    <aside
      className="flex w-14 shrink-0 flex-col items-center gap-3 border-r py-4"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-primary)",
      }}
    >
      <button
        type="button"
        onClick={newChat}
        className="rounded-lg p-2.5 text-[var(--color-bg)] transition hover:bg-white/15"
        title="New chat"
        aria-label="New chat"
      >
        <Plus size={22} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="rounded-lg p-2.5 text-[var(--color-bg)] transition hover:bg-white/15"
        title="History"
        aria-label="History"
      >
        <History size={22} strokeWidth={2} />
      </button>
    </aside>
  );
}
