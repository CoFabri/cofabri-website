// src/components/developer-portal/docs/GuideBlockView.tsx

import type { GuideBlock } from '@/lib/developer-portal/guides/types';

export function GuideBlockView({ block }: { block: GuideBlock }) {
  if (block.kind === 'paragraph') {
    return <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">{block.text}</p>;
  }

  if (block.kind === 'note') {
    const tone =
      block.tone === 'warning'
        ? 'border-warning/25 bg-warning/10 text-foreground'
        : 'border-accent-solid/20 bg-accent text-accent-foreground';
    return <div className={`mt-4 rounded-lg border px-4 py-3 text-sm leading-relaxed ${tone}`}>{block.text}</div>;
  }

  if (block.kind === 'code') {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-[#2B353D] bg-[#171D22]">
        <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#E6ECF0]">
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }

  if (block.kind === 'table' && block.table) {
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {block.table.headers.map((h) => (
                <th key={h} className="py-2 pr-4 text-left font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                {row.map((cell, j) => (
                  <td key={j} className={`py-2.5 pr-4 ${j === 0 ? 'font-mono text-[13px] font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
