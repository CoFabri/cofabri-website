// CMS-supplied links (banner, popup, author profiles, legal documents, app
// URLs) are rendered as hrefs. Only web, mail and phone links or same-site
// paths are allowed; javascript:, data:, vbscript: and anything else
// returns undefined so the caller can drop the link.
const ALLOWED = /^(https?:|mailto:|tel:|#|\/(?![\/\\]))/i;
// Browsers strip tabs/newlines from URLs, which could smuggle a scheme past the check.
const CONTROL = /[\u0000-\u001f\u007f]/;

export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed || CONTROL.test(trimmed) || !ALLOWED.test(trimmed)) return undefined;
  return trimmed;
}
