import { describe, it, expect } from 'vitest';
import { getAppGuide } from './index';

describe('maven-os guide', () => {
  const guide = getAppGuide('maven-os');

  it('is registered and well formed', () => {
    expect(guide).not.toBeNull();
    expect(guide!.appId).toBe('maven-os');
    expect(guide!.intro.length).toBeGreaterThan(0);
    const ids = guide!.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining(['mcp-overview', 'mcp-key', 'mcp-claude', 'mcp-access', 'mcp-read-tools', 'mcp-write-tools', 'mcp-limits-errors', 'rest-intro', 'rest-errors'])
    );
    for (const section of guide!.sections) {
      expect(section.title.trim().length, `section "${section.id}" has no title`).toBeGreaterThan(0);
      expect(section.blocks.length, `section "${section.id}" has no blocks`).toBeGreaterThan(0);
      for (const b of section.blocks) {
        if (b.kind === 'code') expect(b.code?.length).toBeGreaterThan(0);
        else if (b.kind === 'table') {
          expect(b.table!.rows.length).toBeGreaterThan(0);
          for (const r of b.table!.rows) expect(r.length).toBe(b.table!.headers.length);
        } else expect(b.text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('headings are sentence case (no Title Case words after the first)', () => {
    for (const s of guide!.sections) {
      const rest = s.title.split(' ').slice(1);
      for (const w of rest) {
        if (['MCP', 'REST', 'API', 'MavenOS', 'Assistant', 'Claude'].includes(w)) continue;
        expect(w, `heading "${s.title}"`).toBe(w.toLowerCase());
      }
    }
  });

  it('contains no realistic key or secret, and no emoji', () => {
    const text = JSON.stringify(guide);
    // `sk_` must not start a token: tool names like set_task_status legitimately contain "sk_".
    expect(text).not.toMatch(/(?<![a-z])sk_|key_live|Bearer [A-Za-z0-9]{20,}/);
    expect(text).not.toMatch(/mos_[a-z0-9]{6,}_[A-Za-z0-9]{8,}/);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(text).toContain('YOUR_ASSISTANT_KEY');
  });

  it('documents the endpoint and the real limits', () => {
    const text = JSON.stringify(guide);
    expect(text).toContain('https://os.mavenx.co/api/mcp');
    expect(text).toContain('60 calls a minute');
    expect(text).toContain('Streamable HTTP');
  });

  it('lists each tool once, and leaves out internal or HR surfaces', () => {
    const names: string[] = [];
    for (const s of guide!.sections.filter((x) => x.id.startsWith('mcp-') && x.id.endsWith('-tools'))) {
      for (const b of s.blocks) if (b.kind === 'table') names.push(...b.table!.rows.map((r) => r[0]));
    }
    expect(names.length).toBe(new Set(names).size);
    expect(names).toEqual(expect.arrayContaining(['whoami', 'search', 'list_invoices', 'create_task', 'delete_project_phase']));
    const text = JSON.stringify(guide);
    expect(text).not.toContain('hire.started');
    expect(text).not.toMatch(/platform admin|staff/i);
  });
});
