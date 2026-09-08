import { describe, expect, it } from 'vitest';

import {
  EXPORT_EMPTY_CELL,
  type ExportDocument,
  neutralizeFormula,
  sanitizeExportFilename,
  toExportMatrix
} from '@cio/utils/export';

type Learner = { name: string; email: string; score: number | null };

const doc: ExportDocument<Learner> = {
  filename: 'roster',
  title: 'Roster',
  columns: [
    { key: 'name', header: 'Name', value: (row) => row.name },
    { key: 'email', header: 'Email', value: (row) => row.email },
    { key: 'score', header: 'Score', value: (row) => row.score }
  ],
  rows: [
    { name: 'Ada', email: 'ada@test.dev', score: 90 },
    { name: 'Grace', email: 'grace@test.dev', score: null }
  ]
};

describe('export document', () => {
  it('renders header and body positionally', () => {
    const matrix = toExportMatrix(doc);

    expect(matrix.head).toEqual(['Name', 'Email', 'Score']);
    expect(matrix.body).toEqual([
      ['Ada', 'ada@test.dev', 90],
      ['Grace', 'grace@test.dev', EXPORT_EMPTY_CELL]
    ]);
  });

  it('keeps both columns when two share a translated header', () => {
    // Two exercises with the same title, or an exercise called "Email".
    const duplicated: ExportDocument<{ a: string; b: string }> = {
      filename: 'f',
      title: 't',
      columns: [
        { key: 'a', header: 'Quiz', value: (row) => row.a },
        { key: 'b', header: 'Quiz', value: (row) => row.b }
      ],
      rows: [{ a: 'first', b: 'second' }]
    };

    const matrix = toExportMatrix(duplicated);

    expect(matrix.head).toEqual(['Quiz', 'Quiz']);
    expect(matrix.body).toEqual([['first', 'second']]);
  });

  it('renders empty and null cells identically', () => {
    const withEmptyString: ExportDocument<{ value: string }> = {
      filename: 'f',
      title: 't',
      columns: [{ key: 'value', header: 'Value', value: (row) => row.value }],
      rows: [{ value: '' }]
    };

    expect(toExportMatrix(withEmptyString).body[0][0]).toBe(EXPORT_EMPTY_CELL);
  });

  it('preserves zero rather than treating it as empty', () => {
    const withZero: ExportDocument<{ value: number }> = {
      filename: 'f',
      title: 't',
      columns: [{ key: 'value', header: 'Value', value: (row) => row.value }],
      rows: [{ value: 0 }]
    };

    expect(toExportMatrix(withZero).body[0][0]).toBe(0);
  });
});

describe('neutralizeFormula', () => {
  // A learner controls their own display name; an admin opens the export on a
  // trusted machine. Excel evaluates these prefixes as formulas.
  it.each(['=HYPERLINK("http://evil.test")', '+1+1', '-1+1', '@SUM(A1)'])('defuses %s', (payload) => {
    const defused = neutralizeFormula(payload);

    expect(defused).toBe(`\t${payload}`);
    expect(String(defused).startsWith('\t')).toBe(true);
  });

  it('leaves ordinary values untouched', () => {
    expect(neutralizeFormula('Ada Lovelace')).toBe('Ada Lovelace');
    expect(neutralizeFormula('ada@test.dev')).toBe('ada@test.dev');
    expect(neutralizeFormula(90)).toBe(90);
    expect(neutralizeFormula(null)).toBeNull();
  });

  it('applies through the document pipeline, not just in isolation', () => {
    const hostile: ExportDocument<{ name: string }> = {
      filename: 'f',
      title: 't',
      columns: [{ key: 'name', header: 'Name', value: (row) => row.name }],
      rows: [{ name: '=cmd|calc' }]
    };

    expect(toExportMatrix(hostile).body[0][0]).toBe('\t=cmd|calc');
  });
});

describe('sanitizeExportFilename', () => {
  it('strips characters that are legal in a title but not in a filename', () => {
    expect(sanitizeExportFilename('Data: Science / Intro *2026*')).toBe('Data Science Intro 2026');
  });

  it('falls back when nothing usable is left', () => {
    expect(sanitizeExportFilename('///', 'export')).toBe('export');
  });

  it('caps the length so the download does not fail on long titles', () => {
    expect(sanitizeExportFilename('a'.repeat(400)).length).toBe(120);
  });
});
