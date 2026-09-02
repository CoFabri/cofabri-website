import Link from 'next/link';
import ContactForm from './ContactForm';

const CONTACT_ROWS = [
  { k: 'Hours', v: 'Mon–Fri 9am–5pm, Sat 10am–2pm' },
  { k: 'Response time', v: 'Within 1 business day' },
];

export default function Contact() {
  return (
    <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_560px] lg:gap-24">
      <div>
        <div className="border-t border-border">
          {CONTACT_ROWS.map((row) => (
            <div key={row.k} className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-border py-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">{row.k}</span>
              <span className="text-base text-ink-body">{row.v}</span>
            </div>
          ))}
          <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-border py-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">Bug or account issue?</span>
            <Link href="/support" className="text-base font-semibold text-primary hover:text-accent-hover">
              Use Support instead →
            </Link>
          </div>
        </div>
        <div className="mt-9 flex gap-3">
          <a
            href="https://twitter.com/cofabri"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CoFabri on X"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:border-ink-disabled hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/company/cofabri"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CoFabri on LinkedIn"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:border-ink-disabled hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
              />
            </svg>
          </a>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}
