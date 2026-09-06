export function Footer() {
  return (
    <footer className="border-t-2 border-[var(--ink)] bg-[var(--ink)] py-10 text-[var(--paper)]">
      <div className="container grid gap-4 md:grid-cols-[1fr_2fr]">
        <p className="font-black">VisionKit</p>
        <p className="max-w-3xl text-sm leading-6 text-white/75">
          VisionKit is an informal visual-performance tool made for curiosity and fun. Results come
          from browser-based tests and are not a medical exam, diagnosis, or prescription. If you
          have concerns about your vision, consult a qualified eye-care professional.
        </p>
      </div>
    </footer>
  );
}
