import { describe, expect, it } from 'vitest';
import {
  HANDOFF_COPY,
  HANDOFF_STEPS,
  STEP_COUNT,
  resolveStep,
  sectionProgress,
  stepFromProgress,
  windowState,
} from './handoff';

describe('hand-off steps', () => {
  it('has the four steps in order', () => {
    expect(STEP_COUNT).toBe(4);
    expect(HANDOFF_STEPS.map((s) => s.title)).toEqual(['We draft it', 'You approve it', 'We run it', 'You see it land']);
  });

  it('is plain placeholder copy: no price, no real results, no platform name', () => {
    const all = JSON.stringify([HANDOFF_COPY, HANDOFF_STEPS]);
    expect(all).not.toMatch(/\$\s?\d|\d+\s?%|per month|gohighlevel|highlevel|\bghl\b/i);
  });
});

describe('windowState', () => {
  it('step 1: a draft waiting for approval, with the approval bar and one log row', () => {
    const s = windowState(0);
    expect(s.pill).toEqual({ label: 'Draft · waiting for you', tone: 'neutral', icon: 'none' });
    expect(s.approval).toBe(true);
    expect(s.lead).toBe(false);
    expect(s.log.map((r) => r.text)).toEqual(['Ad drafted']);
  });

  it('step 2: approved by you, log grows newest first', () => {
    const s = windowState(1);
    expect(s.pill).toMatchObject({ label: 'Approved by you', tone: 'accent', icon: 'check' });
    expect(s.approval).toBe(false);
    expect(s.log.map((r) => r.text)).toEqual(['Ad approved', 'Ad drafted']);
    expect(s.log[0].by).toBe('You');
  });

  it('step 3: live, with a dot', () => {
    const s = windowState(2);
    expect(s.pill).toMatchObject({ label: 'Live', tone: 'success', icon: 'dot' });
    expect(s.log[0]).toMatchObject({ text: 'Ad went live', by: 'CoFabri team' });
  });

  it('step 4: adds the lead card and the automatic log row', () => {
    const s = windowState(3);
    expect(s.lead).toBe(true);
    expect(s.log).toHaveLength(4);
    expect(s.log[0]).toMatchObject({ text: 'Lead added from the ad', by: 'Automatic' });
    expect(s.pill.label).toBe('Live');
  });

  it('clamps an out-of-range step', () => {
    expect(windowState(-3)).toEqual(windowState(0));
    expect(windowState(99)).toEqual(windowState(3));
  });
});

describe('scroll mapping', () => {
  it('measures progress through a pinned section of 300vh', () => {
    const vh = 800;
    const height = 3 * vh;
    expect(sectionProgress(0, height, vh)).toBe(0);
    expect(sectionProgress(-(height - vh) / 2, height, vh)).toBeCloseTo(0.5);
    expect(sectionProgress(-(height - vh), height, vh)).toBe(1);
    expect(sectionProgress(300, height, vh)).toBe(0); // not reached yet
    expect(sectionProgress(-9999, height, vh)).toBe(1); // scrolled past
    expect(sectionProgress(0, vh, vh)).toBe(0); // nothing to pin
  });

  it('maps progress to four equal bands, holding step 4 to the end', () => {
    expect([0, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 0.99, 1].map((p) => stepFromProgress(p))).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 3]);
  });
});

describe('clicking a step', () => {
  it('holds while the page has not moved, and gives way to scrolling', () => {
    const override = { step: 2, scrollY: 1000 };
    expect(resolveStep(0, 1000, override)).toEqual({ step: 2, override });
    expect(resolveStep(0, 1003, override)).toEqual({ step: 2, override });
    expect(resolveStep(1, 1100, override)).toEqual({ step: 1, override: null });
  });

  it('follows scroll when nothing was clicked', () => {
    expect(resolveStep(3, 500, null)).toEqual({ step: 3, override: null });
  });
});
