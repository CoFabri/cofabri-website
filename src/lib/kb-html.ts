import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Knowledge-base articles come from the CMS as markdown. marked passes raw
// inline HTML straight through, so the rendered HTML is sanitized before it
// reaches dangerouslySetInnerHTML: formatting, tables, links and images
// survive; scripts, event handlers, iframes, styles and javascript: URLs do not.
const KB_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'del', 'input'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    code: ['class'],
    th: ['align', 'colspan', 'rowspan'],
    td: ['align', 'colspan', 'rowspan'],
    ol: ['start'],
    // GFM task-list checkboxes.
    input: ['type', 'checked', 'disabled'],
  },
  allowedClasses: { code: [/^language-[\w-]+$/] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  exclusiveFilter: (frame) => frame.tag === 'input' && frame.attribs.type !== 'checkbox',
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? '');
      return {
        tagName,
        attribs: external ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : attribs,
      };
    },
    input: (tagName, attribs) => ({ tagName, attribs: { ...attribs, disabled: '' } }),
  },
};

const kbMarked = new Marked({ breaks: true, gfm: true });

export function sanitizeKbHtml(html: string): string {
  return sanitizeHtml(html, KB_SANITIZE_OPTIONS);
}

export async function renderKbArticleHtml(markdown: string): Promise<string> {
  if (!markdown) return '';
  return sanitizeKbHtml(await kbMarked.parse(markdown));
}
