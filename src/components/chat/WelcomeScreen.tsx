import { Scale } from "lucide-react";
import { useAppStore } from "../../store/appStore";

export function WelcomeScreen() {
  const suggestedPrompts = useAppStore((s) => s.suggestedPrompts);
  const sendMessage = useAppStore((s) => s.sendMessage);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <Scale size={40} strokeWidth={1.5} style={{ color: "var(--color-primary)" }} />
      <h2 className="mt-4 text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
        Karibu, Treasurer.
      </h2>
      <p className="mt-3 max-w-md text-center text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
        Enter details of a chama dispute. I will analyze the bylaws and M-Pesa records to suggest a fair
        resolution.
      </p>
      <div className="mt-8 flex w-full max-w-lg flex-col gap-3">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => void sendMessage(p)}
            className="rounded-2xl border px-5 py-4 text-left text-sm leading-snug transition hover:shadow-md"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            &ldquo;{p}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
