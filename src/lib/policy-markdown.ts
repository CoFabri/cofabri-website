import { Marked } from 'marked';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A leading slash is a same-site path only when not followed by `/` or `\` (`//x` and `/\x` leave the site).
const SAFE_HREF = /^(https?:|mailto:|\/(?![\/\\])|#)/i;
const slug = (s: string) => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const policyMarked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image() {
      return '';
    },
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const id = slug(inner.replace(/<[^>]+>/g, ''));
      return `<h${depth}${id ? ` id="${id}"` : ''}>${inner}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!href || !SAFE_HREF.test(href.trim())) return text;
      const external = /^https?:\/\//i.test(href);
      return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },
  },
});

export function renderPolicyHtml(markdown: string): string {
  if (!markdown.trim()) return '';
  const tokens = policyMarked.lexer(markdown);
  // The reader page renders the policy title as the h1, so a leading level-1 heading would repeat it.
  const first = tokens.findIndex((t) => t.type !== 'space');
  if (first !== -1 && tokens[first].type === 'heading' && (tokens[first] as { depth: number }).depth === 1) {
    tokens.splice(first, 1);
  }
  return policyMarked.parser(tokens);
}
