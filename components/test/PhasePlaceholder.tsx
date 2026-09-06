import { Button } from "@/components/ui/Button";
export function PhasePlaceholder({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <main className="container flex min-h-[68vh] items-center py-16">
      <div className="max-w-2xl">
        <p className="eyebrow text-[var(--success)]">Planned for {phase}</p>
        <h1 className="mt-4 text-6xl font-black tracking-[-.06em]">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-[var(--muted)]">{description}</p>
        <div className="mt-9">
          <Button href="/" variant="secondary">
            Back to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
