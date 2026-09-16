// src/components/developer-portal/docs/AiPanel.tsx
//
// Only lists entries this app actually publishes -- no MCP row, no
// llms-full.txt row, unless/until a real one exists to point at.

export function AiPanel({ specUrl, llmsTxtUrl }: { specUrl: string; llmsTxtUrl: string }) {
  const items = [
    { href: llmsTxtUrl, label: 'llms.txt', desc: 'Flat index for an agent to crawl' },
    { href: specUrl, label: 'openapi.json', desc: 'Full OpenAPI 3.1 spec' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-accent px-1.5 py-0.5 font-mono text-[11px] font-medium text-accent-foreground">{'{ }'}</span>
          <span className="text-[14.5px] font-semibold text-foreground">Use these docs with AI</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">
          Hand the spec to an assistant, or fetch it directly from your integration.
        </p>
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-[13.5px] text-foreground last:border-b-0 hover:bg-muted"
          >
            <span className="font-mono text-[12.5px] text-accent-solid">{item.label}</span>
            <span className="text-[12px] text-muted-foreground">{item.desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
