import { describe, expect, it } from 'vitest';

import { XLSX_MIME_TYPE, buildXlsx, columnName } from '@cio/utils/export/xlsx';

describe('columnName', () => {
  it('maps the first 26 columns to single letters', () => {
    expect(columnName(0)).toBe('A');
    expect(columnName(25)).toBe('Z');
  });

  it('carries into two letters, base-26 with no zero digit', () => {
    expect(columnName(26)).toBe('AA');
    expect(columnName(27)).toBe('AB');
    expect(columnName(51)).toBe('AZ');
    expect(columnName(52)).toBe('BA');
    expect(columnName(701)).toBe('ZZ');
    expect(columnName(702)).toBe('AAA');
  });
});

describe('buildXlsx', () => {
  const bytes = buildXlsx({
    name: 'Roster',
    head: ['Name', 'Score'],
    body: [
      ['Ada Lovelace', 90],
      ['Grace <Hopper> & "co"', 0]
    ]
  });

  it('produces a ZIP container', () => {
    // Local file header magic — without this no spreadsheet app will open it.
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it('ends with the end-of-central-directory record', () => {
    const tail = bytes.slice(-22, -18);

    expect(Array.from(tail)).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it('records every part in the central directory', () => {
    const text = Buffer.from(bytes).toString('latin1');
    const centralHeaders = text.split('PK').length - 1;

    // Content_Types, .rels, workbook, workbook.rels, styles, sheet1
    expect(centralHeaders).toBe(6);
  });

  it('includes the parts Excel requires', () => {
    const text = Buffer.from(bytes).toString('latin1');

    for (const part of [
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/worksheets/sheet1.xml'
    ]) {
      expect(text).toContain(part);
    }
  });

  it('writes numbers as numeric cells and strings as inline strings', () => {
    const text = Buffer.from(bytes).toString('utf8');

    expect(text).toContain('<c r="B2"><v>90</v></c>');
    expect(text).toContain('t="inlineStr"');
  });

  it('keeps zero as a number rather than dropping it', () => {
    const text = Buffer.from(bytes).toString('utf8');

    expect(text).toContain('<c r="B3"><v>0</v></c>');
  });

  it('escapes XML metacharacters in cell values', () => {
    const text = Buffer.from(bytes).toString('utf8');

    expect(text).toContain('Grace &lt;Hopper&gt; &amp; &quot;co&quot;');
    // A raw `<` inside a value would make the sheet unparseable.
    expect(text).not.toContain('<Hopper>');
  });

  it('marks the header row with the bold cell format', () => {
    const text = Buffer.from(bytes).toString('utf8');

    expect(text).toContain('<c r="A1" t="inlineStr" s="1">');
  });

  it('strips characters Excel rejects from the sheet name', () => {
    const odd = buildXlsx({ name: 'A/B:C*D?E[F]', head: ['x'], body: [['y']] });
    const text = Buffer.from(odd).toString('utf8');

    expect(text).toContain('name="ABCDEF"');
  });

  it('falls back to a usable sheet name when nothing survives', () => {
    const empty = buildXlsx({ name: '[]:*?', head: ['x'], body: [['y']] });

    expect(Buffer.from(empty).toString('utf8')).toContain('name="Sheet1"');
  });

  it('exposes the spreadsheet mime type', () => {
    expect(XLSX_MIME_TYPE).toContain('spreadsheetml.sheet');
  });
});
