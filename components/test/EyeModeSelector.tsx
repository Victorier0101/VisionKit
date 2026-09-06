import { Button } from "@/components/ui/Button";
import type { EyeMode } from "@/types/tests";

const modes: Array<{ mode: EyeMode; label: string; description: string }> = [
  { mode: "both", label: "Both eyes", description: "Keep both eyes open and look naturally." },
  { mode: "left", label: "Left eye", description: "Cover or gently close your right eye." },
  { mode: "right", label: "Right eye", description: "Cover or gently close your left eye." },
];

export function EyeModeSelector({ onSelect }: { onSelect: (mode: EyeMode) => void }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {modes.map(({ mode, label, description }) => (
        <button
          key={mode}
          className="card min-h-44 p-6 text-left transition-transform hover:-translate-y-1"
          type="button"
          onClick={() => onSelect(mode)}
        >
          <span className="text-2xl font-black">{label}</span>
          <span className="mt-3 block leading-6 text-[var(--muted)]">{description}</span>
        </button>
      ))}
      <div className="md:col-span-3">
        <Button href="/" variant="secondary">
          Cancel test
        </Button>
      </div>
    </div>
  );
}
