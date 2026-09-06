import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type TestCardProps = {
  index: string;
  name: string;
  description: string;
  duration: string;
  href: string;
  available?: boolean;
};
export function TestCard({
  index,
  name,
  description,
  duration,
  href,
  available = false,
}: TestCardProps) {
  return (
    <Card className="flex min-h-72 flex-col p-7">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{index}</span>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-bold">
          {duration}
        </span>
      </div>
      <h2 className="mt-10 text-3xl font-black tracking-[-.04em]">{name}</h2>
      <p className="mt-3 grow leading-6 text-[var(--muted)]">{description}</p>
      <div className="mt-6">
        <Button href={href} variant={available ? "primary" : "secondary"}>
          {available ? "Start test" : "View phase"}
        </Button>
      </div>
    </Card>
  );
}
