import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/appStore";
import { getSessionDisplayTitle } from "../../utils/sessionTitle";

export function HistoryDialog() {
  const historyOpen = useAppStore((s) => s.historyOpen);
  const setHistoryOpen = useAppStore((s) => s.setHistoryOpen);
  const sessions = useAppStore((s) => s.sessions);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const loadSession = useAppStore((s) => s.loadSession);
  const renameSession = useAppStore((s) => s.renameSession);
  const deleteSessionById = useAppStore((s) => s.deleteSessionById);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (!historyOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <button
        type="button"
        className="min-w-0 flex-1 bg-black/30"
        aria-label="Close history"
        onClick={() => setHistoryOpen(false)}
      />
      <aside
        className="flex h-full w-80 shrink-0 flex-col shadow-xl"
        style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--color-primary)" }}>
            History
          </h2>
          <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm" style={{ color: "var(--color-muted)" }}>
              No past disputes yet.
            </li>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const displayTitle = getSessionDisplayTitle(s.title, s.messages);

              return (
                <li
                  key={s.id}
                  className="mb-1 flex items-center gap-1 rounded-lg"
                  style={{
                    background: isActive ? "var(--color-bg)" : undefined,
                    border: isActive ? "2px solid var(--color-clause)" : "2px solid transparent",
                  }}
                >
                  {editingId === s.id ? (
                    <input
                      className="mx-1 min-w-0 flex-1 rounded border px-2 py-2 text-sm"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editTitle.trim()) {
                          renameSession(s.id, editTitle.trim());
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => {
                        if (editTitle.trim()) renameSession(s.id, editTitle.trim());
                        setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm font-medium"
                      style={{ color: "var(--color-text)" }}
                      onClick={() => loadSession(s.id)}
                      title={displayTitle}
                    >
                      {displayTitle}
                    </button>
                  )}
                  {editingId !== s.id && (
                    <div className="flex shrink-0 gap-0.5 pr-1">
                      <button
                        type="button"
                        className="rounded p-1.5 hover:bg-black/5"
                        title="Rename"
                        aria-label="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(s.id);
                          setEditTitle(displayTitle);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 hover:bg-black/5"
                        title="Delete"
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this chat?")) deleteSessionById(s.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </div>
  );
}
