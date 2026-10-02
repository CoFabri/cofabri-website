'use client';

import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Turnstile from './Turnstile';
import { readChatStream, type ChatEvent } from '@/lib/chat/stream';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: { slug: string; title: string }[];
}

interface TicketDraft {
  summary: string;
  appId: string | null;
}

type ChatStatus = 'ok' | 'unavailable' | 'limit';

const UNAVAILABLE = "Chat isn't available right now. Use the form below.";
const LIMIT = "You've reached the chat limit for now. Use the form below.";
const STREAM_FAILED = 'Something went wrong. You can use the form below.';

function turnstileSiteKey(): string | undefined {
  if (process.env.NODE_ENV === 'development') return '1x00000000000000000000AA';
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export default function SupportChat() {
  const searchParams = useSearchParams();
  const appParam = (searchParams?.get('app') ?? '').split(',')[0]?.trim() || undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ChatStatus>('ok');
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(false);
  const [chatToken, setChatToken] = useState('');
  const [draft, setDraft] = useState<TicketDraft | null>(null);
  const [offerTicket, setOfferTicket] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const siteKey = turnstileSiteKey();

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy || status !== 'ok') return;
    if (!verified && !chatToken) {
      setNotice('Please complete the security check, then send your message.');
      return;
    }

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setNotice('');
    setBusy(true);
    setDraft(null);
    setOfferTicket(false);
    scrollDown();

    const finish = (patch: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? patch(m) : m)));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          appId: appParam,
          turnstileToken: verified ? undefined : chatToken,
        }),
      });

      if (response.status === 401) {
        // The chat cookie expired (or was never set): ask again, keep the message.
        setVerified(false);
        setChatToken('');
        setMessages(history.slice(0, -1));
        setInput(text);
        setNotice('Please complete the security check again, then send your message.');
        return;
      }
      if (!response.ok) {
        setStatus('unavailable');
        finish((m) => ({ ...m, content: UNAVAILABLE }));
        return;
      }

      setVerified(true);
      setChatToken('');
      let sawText = false;

      await readChatStream(response, (event: ChatEvent) => {
        if (event.type === 'text') {
          sawText = true;
          finish((m) => ({ ...m, content: m.content + event.delta }));
          scrollDown();
        } else if (event.type === 'citations') {
          finish((m) => ({ ...m, citations: event.items }));
        } else if (event.type === 'ticket') {
          setDraft({ summary: event.summary, appId: event.appId });
        } else if (event.type === 'done') {
          if (event.offerTicket) setOfferTicket(true);
        } else if (event.type === 'limit') {
          setStatus('limit');
          finish((m) => ({ ...m, content: LIMIT }));
        } else if (event.type === 'unavailable') {
          setStatus('unavailable');
          finish((m) => ({ ...m, content: UNAVAILABLE }));
        } else if (event.type === 'error') {
          // Keep whatever text already arrived, and point at the form.
          finish((m) => ({ ...m, content: m.content ? `${m.content}\n\n${STREAM_FAILED}` : STREAM_FAILED }));
        }
      });
      if (!sawText) finish((m) => (m.content ? m : { ...m, content: STREAM_FAILED }));
    } catch {
      setStatus('unavailable');
      finish((m) => ({ ...m, content: UNAVAILABLE }));
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  const showTicketCard = draft !== null || offerTicket;

  return (
    <section aria-label="Support chat" className="mb-8 rounded-2xl border border-border p-6 sm:p-9">
      <h2 className="text-2xl font-semibold">Ask a Question</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask about anything in our help articles. If we can&apos;t answer, we&apos;ll help you send a message to the team.{' '}
        <a href="#support-form" className="text-primary hover:underline">
          Prefer a Form?
        </a>
      </p>

      <div ref={scrollRef} className="mt-6 max-h-[420px] space-y-4 overflow-y-auto" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div
              className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              {m.content || (busy && i === messages.length - 1 ? '…' : '')}
            </div>
            {m.citations && m.citations.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                {m.citations.map((c) => (
                  <li key={c.slug}>
                    <a href={`/knowledge-base/${encodeURIComponent(c.slug)}`} className="text-primary hover:underline">
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {status === 'ok' ? (
        <div className="mt-6 space-y-3">
          {!verified && siteKey && (
            <Turnstile
              key="support-chat-turnstile"
              siteKey={siteKey}
              onVerify={(token) => setChatToken(token)}
              onError={() => setChatToken('')}
              onExpire={() => setChatToken('')}
              theme="light"
              size="normal"
              className="flex justify-start"
            />
          )}
          {notice && <p className="text-sm text-danger">{notice}</p>}
          <div className="flex gap-3">
            <textarea
              aria-label="Your message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              maxLength={2000}
              rows={2}
              placeholder="Type your question…"
              className="min-h-[44px] flex-1 rounded-lg border border-border-strong px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !input.trim()}
              className="self-end rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{status === 'limit' ? LIMIT : UNAVAILABLE}</p>
      )}

      {showTicketCard && (
        <TicketCard
          key={draft?.summary ?? 'offer'}
          initialSummary={draft?.summary ?? ''}
          appId={draft?.appId ?? null}
          siteKey={siteKey}
        />
      )}
    </section>
  );
}

function TicketCard({ initialSummary, appId, siteKey }: { initialSummary: string; appId: string | null; siteKey?: string }) {
  const [summary, setSummary] = useState(initialSummary);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const ready = summary.trim() && firstName.trim() && lastName.trim() && email.trim() && token;

  async function submit() {
    if (!ready || state === 'sending') return;
    setState('sending');
    setError('');
    const form = new FormData();
    form.append('firstName', firstName.trim());
    form.append('lastName', lastName.trim());
    form.append('email', email.trim());
    form.append('languagePreference', 'English');
    form.append('companyOrganization', '');
    form.append('preferredContactMethod', 'email');
    form.append('phone', '');
    form.append('applications', JSON.stringify(appId ? [appId] : []));
    form.append('subject', 'support');
    form.append('description', summary.trim());
    form.append('turnstileToken', token);
    form.append('entryPoint', 'chat');
    form.append('tenantName', '');
    form.append('audience', 'staff');
    try {
      const response = await fetch('/api/support', { method: 'POST', body: form });
      if (response.ok) {
        setState('sent');
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || 'We could not send your message. Please try again or use the form below.');
      setState('error');
    } catch {
      setError('We could not send your message. Please try again or use the form below.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm" role="status">
        Message sent. Check your email for a confirmation with your ticket number.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted p-4" aria-label="Message to support">
      <h3 className="text-base font-semibold">Send This to Support</h3>
      <textarea
        aria-label="Summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        maxLength={1900}
        rows={3}
        placeholder="Describe the problem…"
        className="w-full rounded-lg border border-border-strong px-4 py-3 text-sm"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input aria-label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="rounded-lg border border-border-strong px-4 py-3 text-sm" />
        <input aria-label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="rounded-lg border border-border-strong px-4 py-3 text-sm" />
      </div>
      <input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-border-strong px-4 py-3 text-sm" />
      {siteKey && (
        <Turnstile
          key="support-chat-ticket-turnstile"
          siteKey={siteKey}
          onVerify={setToken}
          onError={() => setToken('')}
          onExpire={() => setToken('')}
          theme="light"
          size="normal"
          className="flex justify-start"
        />
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!ready || state === 'sending'}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
