import { renderHtmlDiff, tokenizeHtml } from './lesson-version-diff';

const ADDED = '<ins class="version-added">';
const REMOVED = '<del class="version-removed">';

describe('tokenizeHtml', () => {
  it('separates tags from words', () => {
    expect(tokenizeHtml('<p>two words</p>')).toEqual(['<p>', 'two', ' ', 'words', '</p>']);
  });

  it('keeps a tag whole when an attribute value contains an angle bracket', () => {
    expect(tokenizeHtml('<img alt="a > b" src="x.png">')).toEqual(['<img alt="a > b" src="x.png">']);
  });

  it('emits an unterminated tag rather than dropping it', () => {
    expect(tokenizeHtml('<p')).toEqual(['<p']);
  });
});

describe('renderHtmlDiff', () => {
  it('marks nothing when the content is unchanged', () => {
    expect(renderHtmlDiff('<p>same</p>', '<p>same</p>')).toBe('<p>same</p>');
  });

  it('marks only the changed word inside a long single-line paragraph', () => {
    const body =
      'Model-View-Controller (MVC) is a fundamental architectural pattern used to decouple the user interface.';
    const result = renderHtmlDiff(
      `<h3>MVC</h3><p>${body}</p>`,
      `<h3>MVC</h3><p>${body.replace('fundamental', 'foundational')}</p>`
    );

    // The regression this guards: diffing by line treated the whole lesson as
    // one changed line, so a single word edit highlighted everything.
    expect(result.match(/version-(added|removed)/g)).toHaveLength(2);
    expect(result).toContain(`${REMOVED}fundamental</del>`);
    expect(result).toContain(`${ADDED}foundational</ins>`);
    expect(result).toContain('<h3>MVC</h3>');
    expect(result).toContain('decouple the user interface.');
  });

  it('marks an inserted word without swallowing the surrounding spaces', () => {
    expect(renderHtmlDiff('<p>hello world</p>', '<p>hello brave world</p>')).toBe(
      `<p>hello ${ADDED}brave</ins> world</p>`
    );
  });

  it('keeps a space around a deleted word so neighbours do not collide', () => {
    expect(renderHtmlDiff('<p>hello brave world</p>', '<p>hello world</p>')).toBe(
      `<p>hello ${REMOVED}brave</del> world</p>`
    );
  });

  it('preserves inline formatting tags across a replacement', () => {
    expect(
      renderHtmlDiff(
        '<p>The <strong>Model</strong> manages data</p>',
        '<p>The <strong>Model</strong> manages state</p>'
      )
    ).toBe(`<p>The <strong>Model</strong> manages ${REMOVED}data</del>${ADDED}state</ins></p>`);
  });

  it('never places a tag inside a marker', () => {
    const result = renderHtmlDiff('<p>a b</p><p>c</p>', '<p>a x</p><p>c d</p>');

    expect(/<(ins|del)[^>]*>[^<]*<(?!\/(ins|del))/.test(result)).toBe(false);
  });

  it('treats the first version as entirely added', () => {
    expect(renderHtmlDiff('', '<p>brand new</p>')).toBe(`<p>${ADDED}brand new</ins></p>`);
  });

  it('keeps the tags of an added block', () => {
    expect(renderHtmlDiff('<p>one</p>', '<p>one</p><p>two</p>')).toBe(`<p>one</p><p>${ADDED}two</ins></p>`);
  });

  it('drops the tags of a deleted block so the output cannot be unbalanced', () => {
    expect(renderHtmlDiff('<p>one</p><p>two</p>', '<p>one</p>')).toBe(`<p>one</p>${REMOVED}two</del>`);
  });

  it('tolerates missing content on either side', () => {
    expect(renderHtmlDiff(null as unknown as string, '<p>x</p>')).toBe(`<p>${ADDED}x</ins></p>`);
    expect(renderHtmlDiff('<p>x</p>', null as unknown as string)).toBe(`${REMOVED}x</del>`);
  });
});
