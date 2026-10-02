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
});
