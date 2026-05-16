import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  thinking: string;
}

export function ThinkingBlock({ thinking }: Props) {
  const [open, setOpen] = useState(false);
  if (!thinking.trim()) return null;

  return (
    <div className="mb-2 rounded-md border border-dashed px-3 py-2 text-sm opacity-80" style={{ borderColor: "var(--color-border)" }}>
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left font-medium"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Thinking
      </button>
      {open && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{thinking}</pre>}
    </div>
  );
}
