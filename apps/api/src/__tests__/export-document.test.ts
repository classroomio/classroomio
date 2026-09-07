import { describe, expect, it } from 'vitest';

import {
  EXPORT_EMPTY_CELL,
  type ExportDocument,
  sanitizeExportFilename,
  toExportMatrix,
  toExportRecords
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
  it('maps rows to records keyed by the translated header', () => {
    expect(toExportRecords(doc)).toEqual([
      { Name: 'Ada', Email: 'ada@test.dev', Score: 90 },
      { Name: 'Grace', Email: 'grace@test.dev', Score: EXPORT_EMPTY_CELL }
    ]);
  });

  it('renders CSV and PDF views from the same columns, so they cannot drift', () => {
    const records = toExportRecords(doc);
    const matrix = toExportMatrix(doc);

    expect(matrix.head).toEqual(['Name', 'Email', 'Score']);
    expect(matrix.body).toEqual([
      ['Ada', 'ada@test.dev', 90],
      ['Grace', 'grace@test.dev', EXPORT_EMPTY_CELL]
    ]);
    // Same values, two shapes.
    expect(matrix.body[0]).toEqual(Object.values(records[0]));
  });

  it('renders empty and null cells identically', () => {
    const withEmptyString: ExportDocument<{ value: string }> = {
      filename: 'f',
      title: 't',
      columns: [{ key: 'value', header: 'Value', value: (row) => row.value }],
      rows: [{ value: '' }]
    };

    expect(toExportRecords(withEmptyString)[0].Value).toBe(EXPORT_EMPTY_CELL);
  });

  it('preserves zero rather than treating it as empty', () => {
    const withZero: ExportDocument<{ value: number }> = {
      filename: 'f',
      title: 't',
      columns: [{ key: 'value', header: 'Value', value: (row) => row.value }],
      rows: [{ value: 0 }]
    };

    expect(toExportRecords(withZero)[0].Value).toBe(0);
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
