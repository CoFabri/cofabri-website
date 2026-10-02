import { describe, expect, it } from 'vitest';
import { createNdjsonParser, readChatStream, type ChatEvent } from './stream';

describe('createNdjsonParser', () => {
  it('parses whole lines', () => {
    const seen: ChatEvent[] = [];
    const p = createNdjsonParser((e) => seen.push(e));
    p.push('{"type":"text","delta":"Hi"}\n{"type":"done"}\n');
    expect(seen).toEqual([{ type: 'text', delta: 'Hi' }, { type: 'done' }]);
  });
  it('buffers a line split across chunks', () => {
    const seen: ChatEvent[] = [];
    const p = createNdjsonParser((e) => seen.push(e));
    p.push('{"type":"te');
    p.push('xt","delta":"Hi"}\n');
    expect(seen).toEqual([{ type: 'text', delta: 'Hi' }]);
  });
  it('flushes a final line without a newline', () => {
    const seen: ChatEvent[] = [];
    const p = createNdjsonParser((e) => seen.push(e));
    p.push('{"type":"done"}');
    expect(seen).toEqual([]);
    p.flush();
    expect(seen).toEqual([{ type: 'done' }]);
  });
  it('ignores blank lines, malformed lines and unknown event types', () => {
    const seen: ChatEvent[] = [];
    const p = createNdjsonParser((e) => seen.push(e));
    p.push('\nnot json\n{"type":"mystery"}\n{"type":"done"}\n');
    expect(seen).toEqual([{ type: 'done' }]);
  });
});

describe('createNdjsonParser shape checks', () => {
  it('ignores events with malformed shapes', () => {
    const seen: ChatEvent[] = [];
    const p = createNdjsonParser((e) => seen.push(e));
    p.push('{"type":"text"}\n{"type":"citations","items":"x"}\n{"type":"citations","items":[{"slug":1,"title":"t"}]}\n{"type":"ticket"}\n{"type":"done"}\n');
    expect(seen).toEqual([{ type: 'done' }]);
  });
});

describe('readChatStream', () => {
  it('reads a streamed response body', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"text","delta":"A"}\n{"type"'));
        controller.enqueue(encoder.encode(':"done"}\n'));
        controller.close();
      },
    });
    const seen: ChatEvent[] = [];
    await readChatStream(new Response(body), (e) => seen.push(e));
    expect(seen).toEqual([{ type: 'text', delta: 'A' }, { type: 'done' }]);
  });
  it('cancels the reader when onEvent throws', async () => {
    let cancelled = false;
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(c) {
        c.enqueue(encoder.encode('{"type":"done"}\n'));
      },
      cancel() {
        cancelled = true;
      },
    });
    await expect(
      readChatStream(new Response(body), () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(cancelled).toBe(true);
  });
});
