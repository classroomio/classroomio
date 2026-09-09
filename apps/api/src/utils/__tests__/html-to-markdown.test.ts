import { describe, expect, it, vi } from 'vitest';

vi.mock('@cio/core/utils/sanitize-html', () => ({
  sanitizeHtml: (html: string) => html
}));

import { formatLessonMarkdownDocument, htmlToMarkdown, stripVideoEmbeds } from '../html-to-markdown';

describe('stripVideoEmbeds', () => {
  it('drops iframes, video tags, and YouTube/Vimeo/Loom anchors', () => {
    const html = [
      '<p>Intro</p>',
      '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
      '<video controls src="https://cdn.example.com/lesson.mp4"></video>',
      '<p>Watch <a href="https://youtu.be/abc">this clip</a> and <a href="https://vimeo.com/123">this one</a>.</p>',
      '<p>Also <a href="https://www.loom.com/share/xyz">Loom</a>.</p>',
      '<p>Keep <a href="https://classroomio.com/docs">docs</a>.</p>'
    ].join('');

    const stripped = stripVideoEmbeds(html);

    expect(stripped).toContain('Intro');
    expect(stripped).toContain('Keep');
    expect(stripped).toContain('https://classroomio.com/docs');
    expect(stripped).not.toMatch(/iframe/i);
    expect(stripped).not.toMatch(/<video/i);
    expect(stripped).not.toContain('youtu.be');
    expect(stripped).not.toContain('vimeo.com');
    expect(stripped).not.toContain('loom.com');
  });
});

describe('htmlToMarkdown', () => {
  it('converts mixed rich lesson HTML and strips video embeds', () => {
    const html = `
      <h2>Getting started</h2>
      <p>Welcome to the <strong>lesson</strong>.</p>
      <pre><code class="language-ts">const greet = (name: string) => \`hi \${name}\`;</code></pre>
      <ul><li>One</li><li>Two</li></ul>
      <img src="https://cdn.example.com/diagram.png" alt="Architecture diagram" />
      <table>
        <tr><th>Term</th><th>Meaning</th></tr>
        <tr><td>SSR</td><td>Server render</td></tr>
      </table>
      <iframe src="https://www.youtube.com/embed/dQw4w9wgGcQ"></iframe>
      <p>More at <a href="https://www.youtube.com/watch?v=dQw4w9wgGcQ">the video</a>.</p>
    `;

    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('## Getting started');
    expect(markdown).toContain('**lesson**');
    expect(markdown).toContain('```');
    expect(markdown).toContain('const greet');
    expect(markdown).toMatch(/-\s+One/);
    expect(markdown).toContain('![Architecture diagram](https://cdn.example.com/diagram.png)');
    expect(markdown).toContain('| Term | Meaning |');
    expect(markdown).toContain('| SSR | Server render |');
    expect(markdown).not.toMatch(/iframe/i);
    expect(markdown).not.toMatch(/<video/i);
    expect(markdown).not.toContain('youtube.com');
  });
});

describe('formatLessonMarkdownDocument', () => {
  it('prefixes the converted body with an ATX heading', () => {
    const markdown = formatLessonMarkdownDocument({
      courseTitle: 'MVC Basics',
      lessonTitle: 'Controllers',
      bodyHtml: '<p>Handle the request.</p>'
    });

    expect(markdown).toBe('# MVC Basics — Controllers\n\nHandle the request.\n');
  });

  it('still returns a heading when the body is empty', () => {
    const markdown = formatLessonMarkdownDocument({
      courseTitle: 'MVC Basics',
      lessonTitle: 'Empty note',
      bodyHtml: ''
    });

    expect(markdown).toBe('# MVC Basics — Empty note\n');
  });
});
