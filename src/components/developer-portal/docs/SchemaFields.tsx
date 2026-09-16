// src/components/developer-portal/docs/SchemaFields.tsx
//
// Renders an OpenAPI JSON Schema's properties as a readable field list --
// name, type, required/optional, description. Deliberately does NOT
// synthesize example values (no fake "inv_91d4"-style IDs): only literal
// const/enum/default values the real spec already declares are ever shown,
// since anything else would be this page inventing data, not describing it.

import type { OpenApiSchema } from '@/lib/developer-portal/openapi-types';

function typeLabel(schema: OpenApiSchema): string {
  if (schema.$ref) return schema.$ref.replace('#/components/schemas/', '');
  if (schema.type === 'array') return `${typeLabel(schema.items || {})}[]`;
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
  return schema.type || 'any';
}

function literalHint(schema: OpenApiSchema): string | undefined {
  if (schema.const !== undefined) return `const: ${JSON.stringify(schema.const)}`;
  if (schema.default !== undefined) return `default: ${JSON.stringify(schema.default)}`;
  return undefined;
}

export function SchemaFields({ schema, depth = 0 }: { schema: OpenApiSchema | undefined; depth?: number }) {
  if (!schema) return null;

  if (schema.type === 'array' && schema.items) {
    return <SchemaFields schema={schema.items} depth={depth} />;
  }

  if (!schema.properties) {
    return (
      <div className="py-2 font-mono text-[12.5px] text-muted-foreground">
        {typeLabel(schema)}
        {schema.description ? <span className="ml-2 font-sans text-muted-foreground">{schema.description}</span> : null}
      </div>
    );
  }

  const required = new Set(schema.required || []);

  return (
    <div className={depth > 0 ? 'mt-1 border-l border-border pl-4' : ''}>
      {Object.entries(schema.properties).map(([name, propSchema]) => {
        const hint = literalHint(propSchema);
        return (
          <div key={name} className="border-b border-border/60 py-2.5 last:border-b-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[13px] font-medium text-foreground">{name}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{typeLabel(propSchema)}</span>
              <span className={`font-mono text-[11px] ${required.has(name) ? 'text-danger' : 'text-muted-foreground'}`}>
                {required.has(name) ? 'required' : 'optional'}
              </span>
              {hint ? <span className="font-mono text-[11px] text-accent-solid">{hint}</span> : null}
            </div>
            {propSchema.description ? (
              <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{propSchema.description}</p>
            ) : null}
            {propSchema.properties ? <SchemaFields schema={propSchema} depth={depth + 1} /> : null}
          </div>
        );
      })}
    </div>
  );
}
