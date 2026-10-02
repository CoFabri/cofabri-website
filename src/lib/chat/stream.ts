export type ChatEvent =
  | { type: 'text'; delta: string }
  | { type: 'citations'; items: { slug: string; title: string }[] }
  | { type: 'ticket'; summary: string; appId: string | null }
  | { type: 'limit'; reason: string }
  | { type: 'unavailable'; reason?: string }
  | { type: 'error' }
  | { type: 'done'; flagged?: boolean; offerTicket?: boolean };

const KNOWN = new Set(['text', 'citations', 'ticket', 'limit', 'unavailable', 'error', 'done']);

export function createNdjsonParser(onEvent: (event: ChatEvent) => void) {
  let buffer = '';

  function emit(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed) as ChatEvent;
      if (parsed && typeof parsed === 'object' && KNOWN.has(parsed.type)) onEvent(parsed);
    } catch {
      // A malformed line is skipped; the stream carries on.
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        emit(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');
      }
    },
    flush() {
      emit(buffer);
      buffer = '';
    },
  };
}

export async function readChatStream(response: Response, onEvent: (event: ChatEvent) => void): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createNdjsonParser(onEvent);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.flush();
}
