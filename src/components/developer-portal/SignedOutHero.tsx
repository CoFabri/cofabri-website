// src/components/developer-portal/SignedOutHero.tsx

import Link from 'next/link';

const AGENT_READY_ITEMS = [
  {
    eyebrow: 'llms.txt',
    title: 'Readable by your agent',
    body: 'Every published reference serves a flat text index built for models.',
  },
  {
    eyebrow: 'openapi 3.1',
    title: 'Specs you can generate from',
    body: 'Download the schema and build a typed client in a minute.',
  },
  {
    eyebrow: 'mcp',
    title: 'One endpoint per app',
    body: "Point your editor at an app and call its API from where you work.",
  },
];

function AccessTerminal() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl bg-[#232E36] shadow-[0_30px_60px_-28px_rgba(35,46,54,0.5)]"
    >
      <div className="flex h-11.5 items-center justify-between gap-4 border-b border-[#35424C] px-4">
        <div className="flex items-center gap-2">
          <span className="size-2.25 rounded-full bg-[#3D4A55]" />
          <span className="size-2.25 rounded-full bg-[#3D4A55]" />
          <span className="size-2.25 rounded-full bg-[#3D4A55]" />
        </div>
        <span className="font-mono text-xs text-[#8494A0]">GET /v1/apps</span>
        <span className="rounded-[5px] border border-[#6A3B36] px-1.75 py-0.75 font-mono text-[11px] font-medium text-[#FFB4A8]">
          401
        </span>
      </div>
      <div className="px-5 py-5.5 font-mono text-[13px] leading-[1.85]">
        <div className="text-[#8494A0]">
          <span className="text-[#5AA0F5]">$</span> curl https://api.cofabri.com/v1/apps
        </div>
        <div>&nbsp;</div>
        <div className="text-[#C6D0D6]">{'{'}</div>
        <div className="text-[#C6D0D6]">
          &nbsp;&nbsp;<span className="text-[#8494A0]">{'"error"'}</span>: <span className="text-[#FFB4A8]">{'"not_authenticated"'}</span>,
        </div>
        <div className="text-[#C6D0D6]">
          &nbsp;&nbsp;<span className="text-[#8494A0]">{'"message"'}</span>: <span className="text-[#A8D5B5]">{'"Sign in to view API docs"'}</span>,
        </div>
        <div className="text-[#C6D0D6]">
          &nbsp;&nbsp;<span className="text-[#8494A0]">{'"docs"'}</span>: <span className="text-[#A8D5B5]">{'"cofabri.com/developers"'}</span>
        </div>
        <div className="text-[#C6D0D6]">{'}'}</div>
        <div>&nbsp;</div>
        <div className="flex items-center text-[#8494A0]">
          <span className="text-[#5AA0F5]">$</span>&nbsp;
          <span className="border-b border-[#5AA0F5] pb-px">cofabri auth login</span>
          <span className="ml-0.75 inline-block h-[15px] w-2 animate-pulse bg-[#5AA0F5]" />
        </div>
      </div>
    </div>
  );
}

export function SignedOutHero({ signinUrl }: { signinUrl: string | null }) {
  return (
    <>
      <div className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 py-20 sm:px-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16 lg:py-24">
          <div className="max-w-[520px]">
            <div className="mb-5.5 flex items-center gap-2.5">
              <span className="h-px w-5.5 bg-border-strong" aria-hidden="true" />
              <span className="font-mono text-xs font-medium uppercase tracking-[.1em] text-muted-foreground">
                Developer portal
              </span>
            </div>
            <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tight text-balance sm:text-[46px]">
              Sign in to see app API references.
            </h1>
            <p className="mt-5.5 text-lg leading-relaxed text-muted-foreground">
              Each CoFabri app publishes its own API docs. Sign in and we&apos;ll link you straight to the ones
              your account can use.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {signinUrl ? (
                <a
                  href={signinUrl}
                  className="inline-flex items-center rounded-lg bg-primary px-6.5 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
                >
                  Sign in to CoFabri
                </a>
              ) : (
                <span className="inline-flex items-center rounded-lg border border-dashed border-border-strong px-6.5 py-3.5 text-base font-semibold text-muted-foreground">
                  Sign-in isn&apos;t available yet
                </span>
              )}
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg border border-border-strong bg-card px-5.5 py-3.5 text-base font-semibold text-foreground transition-colors hover:border-ink-faint"
              >
                Request access
              </Link>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Partner or staff accounts. Access to each app&apos;s docs is granted inside that app.
            </div>
          </div>

          <AccessTerminal />
        </div>
      </div>

      <div className="border-b border-border">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="grid sm:grid-cols-3">
            {AGENT_READY_ITEMS.map((item, i) => (
              <div
                key={item.eyebrow}
                className={`py-8 sm:py-9 ${i > 0 ? 'sm:border-l sm:border-border sm:pl-8' : ''} ${
                  i < AGENT_READY_ITEMS.length - 1 ? 'sm:pr-8' : ''
                }`}
              >
                <div className="font-mono text-xs text-primary">{item.eyebrow}</div>
                <div className="mt-2 text-[15px] font-semibold text-foreground">{item.title}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
