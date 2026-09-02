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
      </div>

      <ContactForm />
    </div>
  );
}
