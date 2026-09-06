import { TestCard } from "@/components/home/TestCard";
import { Button } from "@/components/ui/Button";

const tests = [
  {
    index: "01",
    name: "Distance Acuity",
    description: "Use a calibrated directional E to find your smallest reliable size.",
    duration: "1–2 min",
    href: "/tests/distance-acuity",
    available: true,
  },
  {
    index: "02",
    name: "Near Acuity",
    description: "A close-viewing directional test with its own calibrated configuration.",
    duration: "1–2 min",
    href: "/tests/near-acuity",
  },
  {
    index: "03",
    name: "Contrast",
    description: "Find how subtle an E can become while you still identify its direction.",
    duration: "1–2 min",
    href: "/tests/contrast",
  },
  {
    index: "04",
    name: "Colour",
    description: "Spot the tile whose colour is slightly different from the rest.",
    duration: "1–2 min",
    href: "/tests/colour",
  },
  {
    index: "05",
    name: "Calibration",
    description: "Match a real card to your display before size-dependent tests.",
    duration: "1 min",
    href: "/calibration",
  },
];

export default function Home() {
  return (
    <main>
      <section className="border-b-2 border-[var(--ink)] bg-[var(--accent)] py-20 md:py-28">
        <div className="container">
          <p className="eyebrow mb-6">A browser benchmark for your eyes</p>
          <h1 className="display max-w-5xl">Test your visual performance.</h1>
          <div className="mt-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <p className="max-w-xl text-lg leading-7">
              Five quick browser-based vision challenges. No account required. Your data stays in
              this browser.
            </p>
            <Button href="#tests">Start testing</Button>
          </div>
        </div>
      </section>
      <section id="tests" className="container py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow text-[var(--success)]">The challenges</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-.04em]">Pick a test</h2>
          </div>
          <p className="hidden text-sm text-[var(--muted)] md:block">
            Desktop keyboard recommended
          </p>
        </div>
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <TestCard key={test.name} {...test} />
          ))}
        </div>
      </section>
      <section className="border-t-2 border-[var(--ink)] bg-[var(--surface)] py-16">
        <div className="container grid gap-8 md:grid-cols-2">
          <div>
            <p className="eyebrow">Your results</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.04em]">
              A baseline, not a diagnosis.
            </h2>
          </div>
          <p className="max-w-xl leading-7 text-[var(--muted)]">
            Scores can vary with lighting, fatigue, distance, calibration, display settings, and
            attention. Distance Acuity results are now stored locally; the full history dashboard
            arrives in a later phase.
          </p>
        </div>
      </section>
    </main>
  );
}
