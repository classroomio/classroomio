import { describe, expect, it } from 'vitest';

import { captureTextAnchor, findTextAnchor, normalizeAnchorText } from '../src/functions/course-comment-anchor-text';
import { htmlToAnchorText } from '../src/functions/course-comment-html-text';

const LESSON_HTML =
  '<p>Pricing is the fastest lever a business has.</p>' +
  '<p>Yet most founders guess their price in an afternoon and never look at it again.</p>' +
  '<ul><li><p>Cost-plus</p></li><li><p>Value-based</p></li></ul>';

function anchorFor(html: string, quote: string) {
  const text = htmlToAnchorText(html);
  const start = text.indexOf(quote);
  const target = captureTextAnchor(text, start, start + quote.length);
  if (!target) throw new Error('capture failed');

  return target;
}

describe('htmlToAnchorText', () => {
  it('separates blocks with one newline and collapses whitespace', () => {
    expect(htmlToAnchorText(LESSON_HTML)).toBe(
      'Pricing is the fastest lever a business has.\n' +
        'Yet most founders guess their price in an afternoon and never look at it again.\n' +
        'Cost-plus\nValue-based'
    );
  });

  it('decodes entities, keeps inline marks inline and drops scripts', () => {
    expect(htmlToAnchorText('<p>Fish &amp; chips <strong>are</strong>&nbsp;great<script>x()</script></p>')).toBe(
      'Fish & chips are great'
    );
  });

  it('treats br, headings and table cells as breaks', () => {
    expect(htmlToAnchorText('<h2>Title</h2><p>a<br>b</p><table><tr><td>one</td><td>two</td></tr></table>')).toBe(
      'Title\na\nb\none\ntwo'
    );
  });

  it('handles empty and null-like input', () => {
    expect(htmlToAnchorText('')).toBe('');
    expect(htmlToAnchorText('<p></p><p>   </p>')).toBe('');
  });
});

describe('normalizeAnchorText', () => {
  it('maps every character back to its source position', () => {
    const result = normalizeAnchorText([
      { text: 'Hello  ', position: 1 },
      { text: '\n', position: null },
      { text: 'world', position: 20 }
    ]);

    expect(result.text).toBe('Hello\nworld');
    expect(result.positions).toEqual([1, 2, 3, 4, 5, 20, 20, 21, 22, 23, 24]);
  });
});

describe('captureTextAnchor', () => {
  it('stores the quote with its surrounding text', () => {
    const target = anchorFor(LESSON_HTML, 'guess their price');

    expect(target.quote).toBe('guess their price');
    expect(target.prefix.endsWith('Yet most founders ')).toBe(true);
    expect(target.suffix.startsWith(' in an afternoon')).toBe(true);
  });

  it('trims whitespace in the selection and rejects empty selections', () => {
    const text = 'one two three';

    expect(captureTextAnchor(text, 3, 8)?.quote).toBe('two');
    expect(captureTextAnchor(text, 3, 8)?.start).toBe(4);
    expect(captureTextAnchor(text, 3, 4)).toBeNull();
  });
});

describe('findTextAnchor', () => {
  it('follows the quote when text around it is edited', () => {
    const target = anchorFor(LESSON_HTML, 'guess their price');
    const edited = htmlToAnchorText(LESSON_HTML.replace('Yet most founders', 'Sadly, many first-time founders'));
    const match = findTextAnchor(edited, target);

    expect(match).not.toBeNull();
    expect(edited.slice(match!.start, match!.end)).toBe('guess their price');
  });

  it('returns null when the quote is deleted', () => {
    const target = anchorFor(LESSON_HTML, 'guess their price');
    const edited = htmlToAnchorText(LESSON_HTML.replace('guess their price', 'pick a number'));

    expect(findTextAnchor(edited, target)).toBeNull();
  });

  it('picks the duplicate with the same surrounding words', () => {
    const html = '<p>Set the price first.</p><p>Then test the price with customers.</p>';
    const text = htmlToAnchorText(html);
    const secondStart = text.lastIndexOf('the price');
    const target = captureTextAnchor(text, secondStart, secondStart + 'the price'.length)!;

    const edited = htmlToAnchorText('<p>Intro.</p>' + html);
    const match = findTextAnchor(edited, target);

    expect(match?.start).toBe(edited.lastIndexOf('the price'));
  });

  it('refuses to guess between duplicates with the same context', () => {
    const target = { quote: 'price', prefix: 'zzz', suffix: 'zzz', start: 999 };

    expect(findTextAnchor('price and price', target)).toBeNull();
  });

  it('uses the stored start only to break an exact tie', () => {
    const target = { quote: 'price', prefix: '', suffix: '', start: 10 };

    expect(findTextAnchor('price and price', target)).toEqual({ start: 10, end: 15 });
  });

  it('matches quotes whose whitespace changed', () => {
    const target = { quote: 'fastest   lever', prefix: '', suffix: '', start: 0 };

    expect(findTextAnchor(htmlToAnchorText(LESSON_HTML), target)).not.toBeNull();
  });

  it('handles emoji without splitting pairs in the match', () => {
    const text = htmlToAnchorText('<p>Launch 🚀 today</p>');
    const target = captureTextAnchor(text, text.indexOf('🚀'), text.indexOf('🚀') + 2)!;

    expect(findTextAnchor(text, target)).toEqual({ start: 7, end: 9 });
  });
});
