// src/components/developer-portal/docs/EndpointCard.tsx

import type { SpecEndpoint } from '@/lib/developer-portal/openapi-types';
import { SchemaFields } from './SchemaFields';

const METHOD_STYLE: Record<string, string> = {
  get: 'bg-success/15 text-success',
  post: 'bg-accent text-accent-foreground',
  patch: 'bg-warning/15 text-warning',
  put: 'bg-warning/15 text-warning',
  delete: 'bg-danger/15 text-danger',
};

export function endpointSlug(e: SpecEndpoint): string {
  return `${e.method}-${e.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

export function EndpointCard({ endpoint }: { endpoint: SpecEndpoint }) {
  const { method, path, operation } = endpoint;
  const methodClass = METHOD_STYLE[method] || 'bg-muted text-muted-foreground';
  const requestSchema = operation.requestBody?.content?.['application/json']?.schema;
  const responseEntries = Object.entries(operation.responses || {});

  return (
    <div id={endpointSlug(endpoint)} className="scroll-mt-24 overflow-hidden rounded-2xl border border-border">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-sunken px-5 py-4">
        <span className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${methodClass}`}>
          {method}
        </span>
        <span className="font-mono text-[14px] text-foreground">{path}</span>
        {operation.summary ? <span className="ml-auto text-[14px] font-semibold text-foreground">{operation.summary}</span> : null}
      </div>

      <div className="px-5 py-5">
        {operation.description ? (
          <p className="max-w-[680px] text-[14.5px] leading-relaxed text-muted-foreground">{operation.description}</p>
        ) : null}

        {operation.parameters && operation.parameters.length > 0 ? (
          <>
            <div className="mt-5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Parameters
            </div>
            <div className="mt-2 border-t border-border">
              {operation.parameters.map((p) => (
                <div key={p.name} className="grid grid-cols-[minmax(0,180px)_100px_minmax(0,1fr)] gap-4 border-b border-border/60 py-2.5 text-[13.5px]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono font-medium text-foreground">{p.name}</span>
                    <span className={`font-mono text-[11px] ${p.required ? 'text-danger' : 'text-muted-foreground'}`}>
                      {p.required ? 'required' : 'optional'}
                    </span>
                  </div>
                  <span className="font-mono text-[12px] text-muted-foreground">{p.in}</span>
                  <span className="text-muted-foreground">{p.description}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {requestSchema ? (
          <>
            <div className="mt-6 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Request body{operation.requestBody?.required ? ' (required)' : ''}
            </div>
            <SchemaFields schema={requestSchema} />
          </>
        ) : null}

        {responseEntries.length > 0 ? (
          <>
            <div className="mt-6 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Responses</div>
            <div className="mt-2 flex flex-col gap-3">
              {responseEntries.map(([status, response]) => {
                const schema = response.content?.['application/json']?.schema;
                return (
                  <div key={status} className="rounded-lg border border-border/70 px-4 py-3">
                    <div className="flex items-baseline gap-3">
                      <span className={`font-mono text-[12.5px] font-semibold ${status.startsWith('2') ? 'text-success' : 'text-muted-foreground'}`}>
                        {status}
                      </span>
                      <span className="text-[13px] text-muted-foreground">{response.description}</span>
                    </div>
                    {schema ? <SchemaFields schema={schema} /> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
