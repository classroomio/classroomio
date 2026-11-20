import { describe, expect, it } from 'vitest';

import { blocksFromContent, blocksFromHtml, blocksFromMarkdown } from './blocks';

const PAGE = 'https://acme.com/docs/dashboards';

const SIMPLE_HTML = `
  <nav><a href="/docs">Docs</a></nav>
  <main>
    <h1>Dashboards</h1>
    <p>Dashboards show the numbers your team watches.</p>
    <h2>Create a dashboard</h2>
    <p>Start from the workspace home.</p>
    <ol>
      <li>Choose <strong>New dashboard</strong>.</li>
      <li>Name it.</li>
    </ol>
    <ul>
      <li>Charts</li>
      <li>Filters</li>
    </ul>
    <p><img src="/img/dash.png" alt="Dashboard overview">The finished dashboard.</p>
    <pre><code>GET /dashboards</code></pre>
    <blockquote>Dashboards refresh every minute.</blockquote>
    <table>
      <tr><th>Field</th><th>Meaning</th></tr>
      <tr><td>Rows</td><td>One per widget</td></tr>
    </table>
    <iframe src="https://www.youtube.com/embed/abc123"></iframe>
    <footer>© Acme</footer>
  </main>
`;

describe('blocks from HTML', () => {
  it('walks the main content in document order and records the heading path', () => {
    const blocks = blocksFromHtml(SIMPLE_HTML, PAGE);

    expect(blocks.map((block) => block.kind)).toEqual([
      'heading',
      'paragraph',
      'heading',
      'paragraph',
      'step',
      'step',
      'list',
      'paragraph',
      'image',
      'code',
      'callout',
      'table',
      'video'
    ]);
    expect(blocks[0]).toMatchObject({ text: 'Dashboards', headingPath: [] });
    expect(blocks[3]).toMatchObject({
      text: 'Start from the workspace home.',
      headingPath: ['Dashboards', 'Create a dashboard']
    });
  });

  it('numbers ordered steps from the list start and keeps a list as one block', () => {
    const blocks = blocksFromHtml(SIMPLE_HTML, PAGE);
    const steps = blocks.filter((block) => block.kind === 'step');

    expect(steps.map((step) => [step.stepNumber, step.text])).toEqual([
      [1, 'Choose New dashboard.'],
      [2, 'Name it.']
    ]);
    expect(blocks.find((block) => block.kind === 'list')?.text).toBe('- Charts\n- Filters');
  });

  it('resolves media URLs, keeps links out of alt text, and drops page chrome', () => {
    const blocks = blocksFromHtml(SIMPLE_HTML, PAGE);

    expect(blocks.find((block) => block.kind === 'image')).toMatchObject({
      imageUrl: 'https://acme.com/img/dash.png',
      text: 'Dashboard overview'
    });
    expect(blocks.find((block) => block.kind === 'video')?.text).toBe('https://www.youtube.com/embed/abc123');
    expect(blocks.some((block) => block.text.includes('© Acme'))).toBe(false);
    expect(blocks.some((block) => block.text === 'Docs')).toBe(false);
  });

  it('flattens tables to simple HTML', () => {
    const table = blocksFromHtml(SIMPLE_HTML, PAGE).find((block) => block.kind === 'table');

    expect(table?.text).toBe(
      '<table><tr><th>Field</th><th>Meaning</th></tr><tr><td>Rows</td><td>One per widget</td></tr></table>'
    );
  });

  it('treats semantic notes and warnings as callouts', () => {
    const blocks = blocksFromHtml(
      '<main><div role="note">Save before you leave.</div><p class="warning">This deletes the board.</p></main>',
      PAGE
    );

    expect(blocks.map((block) => [block.kind, block.text])).toEqual([
      ['callout', 'Save before you leave.'],
      ['paragraph', 'This deletes the board.']
    ]);
  });
});

describe('blocks from Markdown', () => {
  const MARKDOWN = [
    '# Dashboards',
    '',
    'Dashboards show the numbers your team watches.',
    '',
    '## Create a dashboard',
    '',
    '1. Choose **New dashboard**.',
    '2. Name it.',
    '',
    '- Charts',
    '- Filters',
    '',
    '![Dashboard overview](https://acme.com/img/dash.png)',
    '',
    '> Dashboards refresh every minute.',
    '',
    '| Field | Meaning |',
    '| --- | --- |',
    '| Rows | One per widget |',
    '',
    '```',
    'GET /dashboards',
    '```'
  ].join('\n');

  it('maps headings, steps, lists, images, callouts, tables and code to the same kinds as HTML', () => {
    const blocks = blocksFromMarkdown(MARKDOWN, PAGE);

    expect(blocks.map((block) => block.kind)).toEqual([
      'heading',
      'paragraph',
      'heading',
      'step',
      'step',
      'list',
      'image',
      'callout',
      'table',
      'code'
    ]);
    expect(blocks[3]).toMatchObject({ stepNumber: 1, text: 'Choose New dashboard.' });
    expect(blocks[6]).toMatchObject({ imageUrl: 'https://acme.com/img/dash.png', text: 'Dashboard overview' });
    expect(blocks[8].text).toBe(
      '<table><tr><th>Field</th><th>Meaning</th></tr><tr><td>Rows</td><td>One per widget</td></tr></table>'
    );
  });

  it('keeps an inline image out of the paragraph text and records its heading path', () => {
    const blocks = blocksFromMarkdown('## Steps\n\nClick **Save** then ![Saved](saved.png) appears.', PAGE);

    expect(blocks.map((block) => [block.kind, block.text, block.headingPath])).toEqual([
      ['heading', 'Steps', []],
      ['paragraph', 'Click Save then appears.', ['Steps']],
      ['image', 'Saved', ['Steps']]
    ]);
  });

  it('chooses the parser from the representation the reader settled on', () => {
    expect(blocksFromContent({ format: 'markdown', text: '# Title' }, PAGE)[0]).toMatchObject({
      kind: 'heading',
      text: 'Title'
    });
    expect(blocksFromContent({ format: 'html', text: '<p>Body</p>' }, PAGE)[0]).toMatchObject({
      kind: 'paragraph',
      text: 'Body'
    });
  });
});

describe('blocks from HTML keep everything a page teaches', () => {
  it('keeps a screenshot that sits inside a numbered step, right after that step', () => {
    const blocks = blocksFromHtml(
      '<main><ol><li><p>Open <b>Settings</b>.</p><img src="/s.png" alt="Settings menu"></li><li>Choose Meters.</li></ol></main>',
      PAGE
    );

    expect(blocks.map((block) => [block.kind, block.text])).toEqual([
      ['step', 'Open Settings.'],
      ['image', 'Settings menu'],
      ['step', 'Choose Meters.']
    ]);
    expect(blocks[1].imageUrl).toBe('https://acme.com/s.png');
  });

  it('keeps images inside lists, tables and callouts', () => {
    const blocks = blocksFromHtml(
      '<main><ul><li>Gauge <img src="/g.png" alt="Gauge"></li></ul><table><tr><td><img src="/t.png" alt="Cell"></td><td>Rate</td></tr></table><div class="note">Check the unit. <img src="/n.png" alt="Unit"></div></main>',
      PAGE
    );

    expect(blocks.filter((block) => block.kind === 'image').map((block) => block.text)).toEqual([
      'Gauge',
      'Cell',
      'Unit'
    ]);
  });

  it('keeps loose text that sits next to links and bold text', () => {
    const blocks = blocksFromHtml(
      '<main><div>Meters report every <b>15 minutes</b>; see <a href="/x">intervals</a> for details.<p>Next.</p>Then save.</div></main>',
      PAGE
    );

    expect(blocks.map((block) => block.text)).toEqual([
      'Meters report every 15 minutes; see intervals for details.',
      'Next.',
      'Then save.'
    ]);
  });

  it('separates paragraphs inside one step and one table cell', () => {
    const blocks = blocksFromHtml('<main><ol><li><p>Open Settings.</p><p>Choose Meters.</p></li></ol></main>', PAGE);

    expect(blocks[0].text).toBe('Open Settings. Choose Meters.');
  });

  it('keeps a callout written as an aside and drops an aside that is page chrome', () => {
    const blocks = blocksFromHtml(
      '<main><aside class="admonition warning">Back up first.</aside><aside>Related articles</aside><p>Body.</p></main>',
      PAGE
    );

    expect(blocks.map((block) => [block.kind, block.text])).toEqual([
      ['callout', 'Back up first.'],
      ['paragraph', 'Body.']
    ]);
  });

  it('gives a heading only the headings above it', () => {
    const blocks = blocksFromHtml('<main><h1>A</h1><h2>B</h2><h2>C</h2><p>Body.</p></main>', PAGE);

    expect(blocks.map((block) => [block.text, block.headingPath])).toEqual([
      ['A', []],
      ['B', ['A']],
      ['C', ['A']],
      ['Body.', ['A', 'C']]
    ]);
  });
  it('keeps every part of the chosen content, not only an article nested in it', () => {
    const blocks = blocksFromHtml(
      '<h2>Get appointment details</h2><article><p>Retrieve appointments by query.</p></article><div>shipmentReference string</div><div>Shipment reference number</div>',
      PAGE
    );

    expect(blocks.map((block) => block.text)).toEqual([
      'Get appointment details',
      'Retrieve appointments by query.',
      'shipmentReference string',
      'Shipment reference number'
    ]);
  });
});

describe('blocks from Markdown keep everything a page teaches', () => {
  it('converts HTML embedded in Markdown instead of dropping it', () => {
    const blocks = blocksFromMarkdown(
      '## Meters\n\n<img src="/m.png" alt="Meter list">\n\n<table><tr><td>kWh</td></tr></table>\n',
      PAGE
    );

    expect(blocks.map((block) => [block.kind, block.headingPath])).toEqual([
      ['heading', []],
      ['image', ['Meters']],
      ['table', ['Meters']]
    ]);
  });

  it('keeps nested sub-steps and images inside steps', () => {
    const blocks = blocksFromMarkdown(
      '1. Open Settings.\n   - Choose Meters\n   - Click Add\n\n   ![Add meter](add.png)\n2. Save.',
      PAGE
    );

    expect(blocks.map((block) => [block.kind, block.text])).toEqual([
      ['step', 'Open Settings. Choose Meters Click Add'],
      ['image', 'Add meter'],
      ['step', 'Save.']
    ]);
  });

  it('keeps an image that is wrapped in a link', () => {
    const blocks = blocksFromMarkdown('See [![Report](report.png)](https://acme.com/report).', PAGE);

    expect(blocks.map((block) => [block.kind, block.text])).toEqual([
      ['paragraph', 'See .'],
      ['image', 'Report']
    ]);
  });
});
