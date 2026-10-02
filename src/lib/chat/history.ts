export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  excluded?: boolean;
}

// The messages sent to /api/chat. A flagged exchange stays visible in the log but is left out, because the
// API screens every user turn in the history and would otherwise answer every later message with the fixed reply.
export function buildHistory(messages: readonly HistoryMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages.filter((m) => !m.excluded).map(({ role, content }) => ({ role, content }));
}
