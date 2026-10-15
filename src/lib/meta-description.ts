const MIN = 100;
const MAX = 160;

function plain(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/[*_`>#|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cuts at the last sentence end (else last space) that fits `max`. */
function clip(text: string, max = MAX): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentence = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (sentence >= MIN) return head.slice(0, sentence + 1);
  return head.slice(0, head.lastIndexOf(' ')).replace(/[,;:\s-]+$/, '') + '…';
}

function ensureStop(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/**
 * Meta description for a page whose summary comes from data and can be too
 * short to be useful. Uses the summary alone when it is long enough, otherwise
 * extends it with other real copy from the same page (`extras`, in order),
 * never inventing text.
 */
export function buildDescription(summary: string | undefined, extras: (string | undefined)[], fallback = ''): string {
  let text = plain(summary ?? '');
  if (!text) text = fallback;
  for (const extra of extras) {
    if (text.length >= MIN) break;
    const more = plain(extra ?? '');
    if (more) text = `${ensureStop(text)} ${more}`.trim();
  }
  return clip(text.trim());
}
