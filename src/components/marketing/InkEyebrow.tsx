/** Eyebrow on the dark ink surface: a 22px hairline, then mono text (the pattern About's NameOrigin uses). */
export default function InkEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className="block h-px w-[22px] flex-none bg-[#55636D]" />
      <span className="font-mono text-xs uppercase tracking-[0.1em] text-[#9AA8B2]">{children}</span>
    </div>
  );
}
