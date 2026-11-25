import { describe, expect, it } from 'vitest';
import { parseContactPrefill } from './contact-prefill';
import { FIELD_LIMITS } from './validation/schemas';

const fromQuery = (qs: string) => {
  const params = new URLSearchParams(qs);
  return parseContactPrefill((name) => params.get(name));
};

describe('parseContactPrefill', () => {
  it('reads topic, subject and message from a link', () => {
    expect(fromQuery('topic=sales&subject=Book%20a%20call&message=I%27d%20like%20to%20talk%20about%20ads.')).toEqual({
      topic: 'sales',
      subject: 'Book a call',
      message: "I'd like to talk about ads.",
    });
  });

  it('ignores an unknown topic and empty values', () => {
    expect(fromQuery('topic=nonsense&subject=&message=%20%20')).toEqual({});
    expect(fromQuery('')).toEqual({});
  });

  it('keeps every valid topic', () => {
    for (const topic of ['sales', 'general', 'developer', 'media', 'billing']) expect(fromQuery(`topic=${topic}`).topic).toBe(topic);
  });

  it('cuts the subject and message to the limits the form and API enforce', () => {
    const out = fromQuery(`subject=${'s'.repeat(500)}&message=${'m'.repeat(5000)}`);
    expect(out.subject).toHaveLength(FIELD_LIMITS.subject);
    expect(out.message).toHaveLength(FIELD_LIMITS.message);
  });

  it('keeps a message multi-line but makes the subject one line', () => {
    const out = fromQuery('subject=One%0ATwo&message=Line%20one%0ALine%20two');
    expect(out.subject).toBe('One Two');
    expect(out.message).toBe('Line one\nLine two');
  });

  it('strips control characters', () => {
    const out = fromQuery('subject=Hi%00%07there&message=Hello%1B%7Fworld');
    expect(out.subject).toBe('Hithere');
    expect(out.message).toBe('Helloworld');
  });

  it('leaves markup as plain text (React escapes it when rendered)', () => {
    expect(fromQuery('message=%3Cscript%3Ealert(1)%3C%2Fscript%3E').message).toBe('<script>alert(1)</script>');
  });
});

import { buildRelatedOptions, findRelated } from './contact-prefill';

describe('the related app or service list', () => {
  const apps = [
    { id: 'cofabri-crm', name: 'CoFabri CRM' },
    { id: 'medoura', name: 'Medoura', faviconUrl: 'https://f.example/m.png' },
  ];
  const services = [
    { id: 'cofabri-marketing', name: 'CoFabri Marketing' },
    { id: 'cofabri-concierge', name: 'CoFabri Concierge' },
  ];

  it('lists the apps, then the services marked as services', () => {
    expect(buildRelatedOptions(apps, services)).toEqual([
      { value: 'cofabri-crm', label: 'CoFabri CRM', image: undefined },
      { value: 'medoura', label: 'Medoura', image: 'https://f.example/m.png' },
      { value: 'cofabri-marketing', label: 'CoFabri Marketing (service)', image: undefined },
      { value: 'cofabri-concierge', label: 'CoFabri Concierge (service)', image: undefined },
    ]);
  });

  it('works with no services, and never lists an id twice', () => {
    expect(buildRelatedOptions(apps, [])).toHaveLength(2);
    expect(buildRelatedOptions(apps, [{ id: 'medoura', name: 'Medoura Again' }])).toHaveLength(2);
  });

  it('finds what a link names, by id or by name, apps before services', () => {
    expect(findRelated(apps, services, 'cofabri-marketing')?.id).toBe('cofabri-marketing');
    expect(findRelated(apps, services, 'CoFabri Concierge')?.id).toBe('cofabri-concierge');
    expect(findRelated(apps, services, 'MEDOURA')?.id).toBe('medoura');
    expect(findRelated(apps, [{ id: 'medoura', name: 'Other' }], 'medoura')?.name).toBe('Medoura');
  });

  it('finds nothing for an unknown or empty value', () => {
    expect(findRelated(apps, services, 'nope')).toBeUndefined();
    expect(findRelated(apps, services, '')).toBeUndefined();
    expect(findRelated(apps, services, null)).toBeUndefined();
  });
});
