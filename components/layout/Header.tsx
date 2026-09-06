import Link from "next/link";

export function Header() {
  return (
    <header className="border-b-2 border-[var(--ink)] bg-[var(--surface)]">
      <div className="container flex h-18 items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-[-.04em]">
          VISION<span className="text-[var(--success)]">KIT</span>
        </Link>
        <nav aria-label="Primary" className="flex gap-5 text-sm font-bold">
          <Link href="/calibration">Calibration</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </div>
    </header>
  );
}
