import type { BackstopInitialState, BackstopNote } from '@/lib/backstop';
import { BACKSTOP_CSS, BACKSTOP_RETRY_SCRIPT } from './backstop-assets';

export interface BackstopPageProps {
  /** From BACKSTOP_SUPPORT_EMAIL. When absent, the Contact support link is omitted. */
  supportEmail?: string;
  /** Live-status slot content. When absent, the slot is not rendered. */
  note?: BackstopNote;
  initialState?: BackstopInitialState;
  /** Shows the "Preview" tag so a preview is never mistaken for a real outage. */
  preview?: boolean;
}

const MARK_PATH = 'M50 1Q55 45 99 50Q55 55 50 99Q45 55 1 50Q45 45 50 1Z';

// Self-contained on purpose: inline CSS and SVG, system fonts, no imports from
// the rest of the site. It renders when cofabri-api (and anything that talks to
// it) is down, so it must not depend on any of it. Design source: Claude Design
// project 27182ef4-ca6e-445b-b857-214abf4c8f61, file backstop/index.html.
export default function BackstopPage({ supportEmail, note, initialState = 'idle', preview = false }: BackstopPageProps) {
  return (
    <div className="bs" id="bs" data-state={initialState === 'idle' ? undefined : initialState}>
      <style dangerouslySetInnerHTML={{ __html: BACKSTOP_CSS }} />
      {preview ? <div className="tag">Preview</div> : null}
      <header>
        <div className="wrap">
          <span className="logo" role="img" aria-label="CoFabri">
            CoFabri
            <svg width="10" height="10" viewBox="0 0 100 100" aria-hidden="true">
              <path d={MARK_PATH} fill="var(--brand)" />
            </svg>
          </span>
        </div>
      </header>
      <main>
        <div className="wrap">
          <div className="copy">
            <div className="pill">
              <span className="dot" aria-hidden="true" />
              Temporarily unavailable
            </div>
            <h1>We&rsquo;re not quite connecting.</h1>
            <p className="lead">
              Parts of CoFabri aren&rsquo;t loading right now, and that may include the app that sent you here. Our team has been
              alerted, so there&rsquo;s nothing you need to do.
            </p>
            <div className="actions">
              <a id="bs-retry" className="btn" href="?retry=1">
                <span className="spin" aria-hidden="true" />
                <span className="l-idle">Try again</span>
                <span className="l-load">Checking&hellip;</span>
              </a>
              {supportEmail ? (
                <a className="link" href={`mailto:${supportEmail}`}>
                  Contact support
                </a>
              ) : null}
            </div>
            <p className="again" role="status">
              Still not connecting<span id="bs-at" />. Give it a minute and try again.
            </p>
            <p className="safe">
              <strong>Your data is safe.</strong> We&rsquo;ll have things running again as soon as we can.
            </p>
            {note ? (
              <section className="note" aria-labelledby="bs-note-h">
                <div className="eyebrow">
                  <span id="bs-note-h">Latest update</span>
                  <time>{note.time}</time>
                </div>
                <p>{note.body}</p>
              </section>
            ) : null}
          </div>
          <svg className="motif" viewBox="-12 -12 124 124" aria-hidden="true">
            <path d={MARK_PATH} className="ghost" fill="none" stroke="var(--ghost)" strokeWidth=".45" strokeDasharray="1.6 1.6" />
            <g transform="translate(7 -6)">
              <g className="float">
                <path d={MARK_PATH} fill="var(--brand)" />
                <path d={MARK_PATH} fill="var(--surface)" transform="translate(15 15) scale(.7)" />
                <path d={MARK_PATH} fill="var(--mark-core)" transform="translate(32 32) scale(.36)" />
              </g>
            </g>
          </svg>
        </div>
      </main>
      <footer>
        <div className="wrap">&copy; {new Date().getFullYear()} CoFabri by Maven X LLC</div>
      </footer>
      <p id="bs-live" className="sr" aria-live="polite" />
      <script dangerouslySetInnerHTML={{ __html: BACKSTOP_RETRY_SCRIPT }} />
    </div>
  );
}
