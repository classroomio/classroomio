import { describe, expect, it } from 'vitest';

import { blocksFromContent } from './blocks';

const PAGE = 'https://help.acme.example/articles/12-export-data';
const BODY =
  'Open the report, choose the columns to keep and press export. The file arrives by email within a few minutes.';

function texts(format: 'html' | 'markdown', text: string): string[] {
  return blocksFromContent({ format, text }, PAGE).map((block) => block.text);
}

describe('page chrome', () => {
  it('drops a feedback widget with its question and hidden replies, and nothing else', () => {
    const html = `<div><p>${BODY}</p></div>
      <div class="feedback">
        <div><h2>Was this article helpful?</h2><button>No</button><button>Yes</button></div>
        <div><p>That is great!</p><p>Thank you for your feedback</p></div>
      </div>`;

    expect(texts('html', html)).toEqual([BODY]);
  });

  it('keeps a code sample when only its copy button goes', () => {
    const html = `<p>${BODY}</p><div class="sample"><button>Copy</button><pre><code>export --all</code></pre></div>`;

    expect(texts('html', html)).toEqual([BODY, 'export --all']);
  });

  it('drops a trailing list of links to other pages of the site, with its heading', () => {
    const html = `<p>${BODY}</p><section><h2>Related articles</h2><ul>
      <li><a href="/articles/3-import">Import data</a></li><li><a href="/articles/4-reports">Build a report</a></li></ul></section>`;
    const markdown = `${BODY}\n\n## Related articles\n\n- [Import data](https://help.acme.example/articles/3-import)\n- [Build a report](/articles/4-reports)\n`;

    expect(texts('html', html)).toEqual([BODY]);
    expect(texts('markdown', markdown)).toEqual([BODY]);
  });

  it('keeps a list of links that the page goes on to explain, and a trailing list that points to other sites', () => {
    const steps = `<ul><li><a href="/articles/3-import">Import data</a></li><li><a href="/articles/4-reports">Build a report</a></li></ul><p>${BODY}</p>`;
    const elsewhere = `<p>${BODY}</p><ul><li><a href="https://standards.example.org/a">Standard A</a></li><li><a href="https://standards.example.org/b">Standard B</a></li></ul>`;

    expect(texts('html', steps)).toHaveLength(2);
    expect(texts('html', elsewhere)).toHaveLength(2);
  });
});
