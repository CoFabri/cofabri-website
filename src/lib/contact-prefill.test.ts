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
