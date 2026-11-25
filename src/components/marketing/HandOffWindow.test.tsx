import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HandOffWindow from './HandOffWindow';
import { DEMO } from '@/lib/services/handoff';

const html = (step: number, compact = false) => renderToStaticMarkup(<HandOffWindow step={step} compact={compact} />);
const countItems = (markup: string) => (markup.match(/<li[ >]/g) ?? []).length;

describe('HandOffWindow', () => {
  it('is decorative and has nothing focusable in it', () => {
    for (let step = 0; step < 4; step++) {
      const out = html(step);
      expect(out).toContain('aria-hidden="true"');
      expect(out).not.toMatch(/<(button|a|input|select|textarea)\b/);
      expect(out).not.toMatch(/tabindex/i);
    }
  });

  it('is the CoFabri CRM window, run by CoFabri Marketing, showing a labelled demo', () => {
    const out = html(0);
    expect(out).toContain('CoFabri CRM');
    expect(out).toContain('Run by');
    expect(out).toContain('CoFabri Marketing');
    expect(out).toContain(`${DEMO.business} · Campaigns`);
    expect(out).toContain(DEMO.headline);
    expect(out).toContain('Facebook · Instagram ad');
    // Labelled as a demo, so it is never mistaken for a real customer.
    expect(out).toContain('>Demo<');
  });

  it('has no bracketed placeholders left', () => {
    for (let step = 0; step < 4; step++) expect(html(step)).not.toMatch(/\[[A-Za-z ]+\]/);
  });

  it('draws the demo photo as an illustration, not a labelled box', () => {
    const out = html(0);
    expect(out).toContain('<svg');
    expect(out).not.toContain('[Your photo]');
  });

  it('step 1: a draft with the approval bar', () => {
    const out = html(0);
    expect(out).toContain('Draft · waiting for you');
    expect(out).toContain('Approve this ad before it runs?');
    expect(out).toContain('Request Changes');
    expect(out).toContain('Ad drafted');
    expect(out).not.toContain('New lead');
  });

  it('step 2: approved by you, no approval bar', () => {
    const out = html(1);
    expect(out).toContain('Approved by you');
    expect(out).toContain('Ad approved');
    expect(out).not.toContain('Approve this ad before it runs?');
  });

  it('step 3: live', () => {
    const out = html(2);
    expect(out).toContain('Ad went live');
    expect(out).not.toContain('Draft · waiting for you');
  });

  it('step 4: a lead lands, from the ad', () => {
    const out = html(3);
    expect(out).toContain(`New lead · ${DEMO.lead.name}`);
    expect(out).toContain('From the Facebook ad');
    expect(out).toContain('Follow Up');
    expect(out).toContain('Lead added from the ad');
  });

  it('lists the log newest first', () => {
    const out = html(3);
    expect(out.indexOf('Lead added from the ad')).toBeLessThan(out.indexOf('Ad went live'));
    expect(out.indexOf('Ad went live')).toBeLessThan(out.indexOf('Ad approved'));
    expect(out.indexOf('Ad approved')).toBeLessThan(out.indexOf('Ad drafted'));
  });

  it('compact (phone) shows only the newest log row and a 72px ad thumbnail', () => {
    const full = html(3);
    const compact = html(3, true);
    expect(countItems(full)).toBe(4);
    expect(countItems(compact)).toBe(1);
    expect(compact).toContain('Lead added from the ad');
    expect(compact).not.toContain('Ad drafted');
    expect(compact).toContain('h-[72px] w-[72px]');
    expect(compact).not.toContain('[Your photo]');
  });

  it('never shows a price, a number or a result: no digits at all in the visible text', () => {
    // Visible text only (the markup itself is full of CSS values).
    const text = (step: number) => html(step).replace(/<[^>]*>/g, ' ');
    for (let step = 0; step < 4; step++) expect(text(step)).not.toMatch(/\d|\$|%/);
  });
});
