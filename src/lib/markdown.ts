/**
 * Minimal inline-Markdown renderer.
 *
 * The source question/answer data uses a constrained subset of inline
 * Markdown: `code`, **bold**, *italic*, and [links](url). This function
 * converts those tokens to safe HTML. It intentionally does NOT handle
 * headings, lists, or other block syntax (those are split out upstream).
 *
 * Output is HTML destined for `set:html`, so every source string is
 * HTML-escaped before tokens are re-inserted.
 */

export interface InlineMarkdownOptions {
  /** Replace newlines with <br> to preserve multi-line text. */
  preserveNewlines?: boolean;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert a single inline-markdown string to safe HTML. */
export function inlineMarkdown(input: string, options: InlineMarkdownOptions = {}): string {
  // Escape HTML first so any stray angle brackets can't inject content.
  const safe = esc(input);

  // Inline code `` `code` `` first (backticks can't be escaped by content).
  let out = '';
  const segments = safe.split('`');
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 1) {
      out += `<code class="inline-code">${segments[i]}</code>`;
    } else {
      out += segments[i];
    }
  }

  // Links [text](https://...). Only http(s) hrefs are allowed, and the URL
  // was already escaped, so the attribute can't break out of the tag.
  out = out.replace(
    /\[([^\]\[]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text* (single asterisks, not part of bold)
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?![*])/g, '$1<em>$2</em>');

  if (options.preserveNewlines) {
    out = out.replace(/\n/g, '<br>');
  }

  return out;
}