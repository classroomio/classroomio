export const SKILL_CSV_COLUMNS = ['code', 'name', 'description', 'parent_code', 'framework'] as const;

export const SKILL_CODE_MAX_LENGTH = 64;
export const SKILL_NAME_MAX_LENGTH = 200;
export const SKILL_FRAMEWORK_MAX_LENGTH = 100;
export const SKILL_IMPORT_MAX_ROWS = 2000;

export type SkillImportRow = {
  code: string;
  name: string;
  description: string | null;
  parentCode: string | null;
  framework: string | null;
};

export type SkillImportRowError = {
  line: number;
  code: string | null;
  message: string;
};

export type SkillCsvParseResult = {
  rows: Array<SkillImportRow & { line: number }>;
  errors: SkillImportRowError[];
};

export type SkillImportPreviewRow = SkillImportRow & { line: number; action: 'create' | 'update' };

export type SkillImportPreview = {
  rows: SkillImportPreviewRow[];
  errors: SkillImportRowError[];
};

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character !== '"') {
        field += character;
        continue;
      }
      if (source[index + 1] === '"') {
        field += '"';
        index += 1;
        continue;
      }
      inQuotes = false;
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }
    if (character === ',') {
      record.push(field);
      field = '';
      continue;
    }
    if (character === '\r' || character === '\n') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      continue;
    }

    field += character;
  }

  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';

  return trimmed === '' ? null : trimmed;
}

/**
 * Parses a skills CSV with the columns code, name, description, parent_code and framework (code and name required,
 * column order free). Blank lines are skipped; a row with no code or name is reported, not thrown.
 */
export function parseSkillCsv(text: string): SkillCsvParseResult {
  const records = parseCsvRecords(text);
  const [header, ...body] = records;
  const errors: SkillImportRowError[] = [];

  if (!header) return { rows: [], errors: [{ line: 1, code: null, message: 'The file is empty' }] };

  const columns = header.map((column) => column.trim().toLowerCase());
  const missing = ['code', 'name'].filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [{ line: 1, code: null, message: `Missing required column: ${missing.join(', ')}` }]
    };
  }

  const read = (record: string[], column: string): string | undefined => record[columns.indexOf(column)];
  const rows: SkillCsvParseResult['rows'] = [];

  body.forEach((record, position) => {
    const line = position + 2;
    if (record.every((value) => value.trim() === '')) return;

    const code = emptyToNull(read(record, 'code'));
    const name = emptyToNull(read(record, 'name'));
    if (!code) {
      errors.push({ line, code: null, message: 'Code is required' });
      return;
    }
    if (!name) {
      errors.push({ line, code, message: 'Name is required' });
      return;
    }

    rows.push({
      line,
      code,
      name,
      description: emptyToNull(read(record, 'description')),
      parentCode: emptyToNull(read(record, 'parent_code')),
      framework: emptyToNull(read(record, 'framework'))
    });
  });

  return { rows, errors };
}

function findParentCycle(rows: SkillImportPreviewRow[], existingParentByCode: Map<string, string | null>): string | null {
  const parentByCode = new Map(existingParentByCode);
  for (const row of rows) parentByCode.set(row.code, row.parentCode);

  for (const row of rows) {
    const seen = new Set<string>();
    let current: string | null = row.code;

    while (current) {
      if (seen.has(current)) return row.code;
      seen.add(current);
      current = parentByCode.get(current) ?? null;
    }
  }

  return null;
}

/**
 * Checks parsed rows against the organisation's existing skills without writing anything. A row is an update when
 * its code already exists, otherwise a create. Reports duplicate codes in the file, over-long values, parents
 * that exist neither in the file nor in the organisation, and parent cycles. Rows come back parents first.
 */
export function previewSkillImport(
  parsed: SkillCsvParseResult,
  existingSkills: ReadonlyArray<{ code: string; parentCode: string | null }>
): SkillImportPreview {
  const errors = [...parsed.errors];
  const existingParentByCode = new Map(existingSkills.map((skill) => [skill.code, skill.parentCode]));
  const fileCodes = new Set(parsed.rows.map((row) => row.code));
  const seenCodes = new Set<string>();
  const rows: SkillImportPreviewRow[] = [];

  if (parsed.rows.length > SKILL_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      errors: [{ line: 1, code: null, message: `A file can hold at most ${SKILL_IMPORT_MAX_ROWS} skills` }]
    };
  }

  for (const row of parsed.rows) {
    const rowError = (message: string) => errors.push({ line: row.line, code: row.code, message });

    if (seenCodes.has(row.code)) {
      rowError('Duplicate code in this file');
      continue;
    }
    seenCodes.add(row.code);

    if (row.code.length > SKILL_CODE_MAX_LENGTH) {
      rowError(`Code is longer than ${SKILL_CODE_MAX_LENGTH} characters`);
      continue;
    }
    if (row.name.length > SKILL_NAME_MAX_LENGTH) {
      rowError(`Name is longer than ${SKILL_NAME_MAX_LENGTH} characters`);
      continue;
    }
    if (row.framework && row.framework.length > SKILL_FRAMEWORK_MAX_LENGTH) {
      rowError(`Framework is longer than ${SKILL_FRAMEWORK_MAX_LENGTH} characters`);
      continue;
    }
    if (row.parentCode === row.code) {
      rowError('A skill cannot be its own parent');
      continue;
    }
    if (row.parentCode && !fileCodes.has(row.parentCode) && !existingParentByCode.has(row.parentCode)) {
      rowError(`Unknown parent code ${row.parentCode}`);
      continue;
    }

    rows.push({ ...row, action: existingParentByCode.has(row.code) ? 'update' : 'create' });
  }

  const cycleCode = findParentCycle(rows, existingParentByCode);
  if (cycleCode) {
    const row = rows.find((candidate) => candidate.code === cycleCode)!;
    errors.push({ line: row.line, code: row.code, message: 'Parent codes form a cycle' });
    return { rows: [], errors: errors.sort((left, right) => left.line - right.line) };
  }

  const rowsByCode = new Map(rows.map((row) => [row.code, row]));
  const ordered: SkillImportPreviewRow[] = [];
  const placed = new Set<string>();
  const place = (row: SkillImportPreviewRow) => {
    if (placed.has(row.code)) return;
    placed.add(row.code);

    const parent = row.parentCode ? rowsByCode.get(row.parentCode) : undefined;
    if (parent) place(parent);
    ordered.push(row);
  };
  rows.forEach(place);

  return { rows: ordered, errors: errors.sort((left, right) => left.line - right.line) };
}

function escapeCsvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function skillRowsToCsv(rows: ReadonlyArray<Partial<Record<(typeof SKILL_CSV_COLUMNS)[number], string | null>>>) {
  const lines = rows.map((row) => SKILL_CSV_COLUMNS.map((column) => escapeCsvField(row[column] ?? '')).join(','));

  return [SKILL_CSV_COLUMNS.join(','), ...lines].join('\n') + '\n';
}
