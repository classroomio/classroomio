import { describe, expect, it } from 'vitest';

import {
  AUDIENCE_IMPORT_MAX_ROWS,
  isImportableEmail,
  parseAudienceImportCsv
} from '@cio/utils/validation/organization';

describe('parseAudienceImportCsv — headers', () => {
  it('reads a header row and maps the columns', () => {
    const parsed = parseAudienceImportCsv('email,name,courses\nada@test.dev,Ada Lovelace,"React,Data"');

    expect(parsed.hadHeader).toBe(true);
    expect(parsed.rows).toEqual([
      { line: 2, email: 'ada@test.dev', name: 'Ada Lovelace', courses: ['React', 'Data'], status: 'ready' }
    ]);
  });

  it('accepts common header aliases', () => {
    const parsed = parseAudienceImportCsv('E-Mail,Full Name\nada@test.dev,Ada');

    expect(parsed.hadHeader).toBe(true);
    expect(parsed.rows[0]).toMatchObject({ email: 'ada@test.dev', name: 'Ada' });
  });

  it('reports unknown columns without failing the file', () => {
    const parsed = parseAudienceImportCsv('email,department\nada@test.dev,Engineering');

    expect(parsed.unknownColumns).toEqual(['department']);
    expect(parsed.rows[0].status).toBe('ready');
  });

  it('treats a first line that is an address as data, not a header', () => {
    const parsed = parseAudienceImportCsv('ada@test.dev\ngrace@test.dev');

    expect(parsed.hadHeader).toBe(false);
    expect(parsed.rows.map((row) => row.email)).toEqual(['ada@test.dev', 'grace@test.dev']);
  });
});

describe('parseAudienceImportCsv — pasted lists', () => {
  it('splits a comma-separated paste into one row per address', () => {
    const parsed = parseAudienceImportCsv('ada@test.dev, grace@test.dev, alan@test.dev');

    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows.every((row) => row.status === 'ready')).toBe(true);
  });

  it('handles newline-separated pastes', () => {
    const parsed = parseAudienceImportCsv('ada@test.dev\n\ngrace@test.dev\n');

    expect(parsed.rows.map((row) => row.email)).toEqual(['ada@test.dev', 'grace@test.dev']);
  });
});

describe('parseAudienceImportCsv — row classification', () => {
  it('flags malformed addresses per row instead of failing the batch', () => {
    const parsed = parseAudienceImportCsv('email\nada@test.dev\nnot-an-email\ngrace@test.dev');

    expect(parsed.rows.map((row) => row.status)).toEqual(['ready', 'invalid_email', 'ready']);
  });

  it('marks the second occurrence of an address as a duplicate', () => {
    const parsed = parseAudienceImportCsv('email\nada@test.dev\nADA@test.dev');

    expect(parsed.rows.map((row) => row.status)).toEqual(['ready', 'duplicate_in_file']);
  });

  it('lower-cases addresses so case is not a distinct learner', () => {
    const parsed = parseAudienceImportCsv('email\nAda@Test.DEV');

    expect(parsed.rows[0].email).toBe('ada@test.dev');
  });

  it('reports a row whose email cell is blank', () => {
    const parsed = parseAudienceImportCsv('email,name\n,Ada Lovelace');

    expect(parsed.rows[0].status).toBe('missing_email');
  });

  it('carries the source line number for error messages', () => {
    const parsed = parseAudienceImportCsv('email\nada@test.dev\nbroken');

    expect(parsed.rows[1]).toMatchObject({ line: 3, status: 'invalid_email' });
  });
});

describe('parseAudienceImportCsv — quoting', () => {
  it('keeps commas inside a quoted course list', () => {
    const parsed = parseAudienceImportCsv('email,courses\nada@test.dev,"React, Data Basics"');

    expect(parsed.rows[0].courses).toEqual(['React', 'Data Basics']);
  });

  it('unescapes doubled quotes', () => {
    const parsed = parseAudienceImportCsv('email,name\nada@test.dev,"Ada ""The Countess"" Lovelace"');

    expect(parsed.rows[0].name).toBe('Ada "The Countess" Lovelace');
  });

  it('keeps a comma inside a quoted name', () => {
    const parsed = parseAudienceImportCsv('email,name\nada@test.dev,"Lovelace, Ada"');

    expect(parsed.rows[0].name).toBe('Lovelace, Ada');
  });
});

describe('parseAudienceImportCsv — limits', () => {
  it('caps the rows and reports how many were left out', () => {
    const lines = ['email'];
    for (let i = 0; i < AUDIENCE_IMPORT_MAX_ROWS + 25; i += 1) {
      lines.push(`learner${i}@test.dev`);
    }

    const parsed = parseAudienceImportCsv(lines.join('\n'));

    expect(parsed.rows).toHaveLength(AUDIENCE_IMPORT_MAX_ROWS);
    // Reported rather than silently dropped, so the admin knows to split the file.
    expect(parsed.truncated).toBe(25);
  });

  it('returns nothing for empty input', () => {
    expect(parseAudienceImportCsv('   \n\n').rows).toEqual([]);
  });
});

describe('isImportableEmail', () => {
  it.each(['ada@test.dev', 'a.b+c@sub.example.co.uk'])('accepts %s', (email) => {
    expect(isImportableEmail(email)).toBe(true);
  });

  it.each(['ada', 'ada@', '@test.dev', 'ada@test', 'a b@test.dev'])('rejects %s', (email) => {
    expect(isImportableEmail(email)).toBe(false);
  });
});
