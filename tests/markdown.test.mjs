import { inlineMarkdown } from '../src/lib/markdown.ts';
import { loadData, test, assert, finish } from './helpers.mjs';

test('escapes raw HTML and returns safe markup', () => {
  const out = inlineMarkdown('<script>alert(1)</script> & "quoted"');
  assert(!out.includes('<script'), 'should not contain raw <script>');
  assert(out.includes('&lt;script&gt;'), 'should escape angle brackets');
  assert(out.includes('&amp;'), 'should escape ampersands');
  assert(out.includes('&quot;'), 'should escape double quotes');
});

test('renders inline code', () => {
  const out = inlineMarkdown('Use `LocalDate.now()` today');
  assert(out.includes('<code class="inline-code">LocalDate.now()</code>'), 'code span missing');
});

test('renders bold and italic', () => {
  const out = inlineMarkdown('**important** and *slightly* different');
  assert(out.includes('<strong>important</strong>'), 'bold missing');
  assert(out.includes('<em>slightly</em>'), 'italic missing');
});

test('renders http(s) links with safe attributes', () => {
  const out = inlineMarkdown('See [the docs](https://developer.android.com) for details');
  assert(
    out.includes('href="https://developer.android.com" target="_blank" rel="noopener noreferrer"'),
    'anchor missing or unsafe'
  );
  assert(!out.includes('javascript:'), 'javascript: must never appear');
});

test('does not render javascript: links', () => {
  const out = inlineMarkdown('See [bad](javascript:alert(1))');
  assert(!out.includes('<a '), 'javascript: scheme should not become a link');
});

test('preserveNewlines replaces newlines with <br>', () => {
  const out = inlineMarkdown('line one\nline two', { preserveNewlines: true });
  assert(out.includes('line one<br>line two'), 'newline not converted');
});

test('newlines left as raw text by default (collapsed by HTML rendering)', () => {
  const out = inlineMarkdown('line one\nline two');
  assert(out.includes('\n'), 'newline should remain untouched');
  assert(!out.includes('<br>'), 'no <br> without the option');
});

test('all real QOTD answers render without raw dangerous tags', () => {
  const q = loadData('questions.json');
  for (const item of q?.questions || []) {
    const out = inlineMarkdown(item.answer, { preserveNewlines: true });
    assert(!/<(script|iframe|style|object)/i.test(out), `answer for ${item.id} contains raw tag`);
  }
});

finish();