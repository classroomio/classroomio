import { describe, expect, it } from 'vitest';

import { parseSkillCsv, previewSkillImport, SKILL_STARTER_SETS, skillRowsToCsv } from '../src/skills';

describe('parseSkillCsv', () => {
  it('reads quoted fields, escaped quotes, commas, CRLF and a BOM', () => {
    const text =
      '\uFEFFcode,name,description,parent_code,framework\r\nA.1,"Add, subtract","Say ""hi""",,Demo\r\n\r\nA.2,Divide,,A.1,\r\n';
    const result = parseSkillCsv(text);

    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { line: 2, code: 'A.1', name: 'Add, subtract', description: 'Say "hi"', parentCode: null, framework: 'Demo' },
      { line: 4, code: 'A.2', name: 'Divide', description: null, parentCode: 'A.1', framework: null }
    ]);
  });

  it('accepts columns in any order and only code and name', () => {
    const result = parseSkillCsv('Name,Code\nFractions,F.1');

    expect(result.rows).toMatchObject([{ code: 'F.1', name: 'Fractions' }]);
  });

  it('reports a missing required column and empty files', () => {
    expect(parseSkillCsv('code,description\nA,B').errors[0].message).toContain('name');
    expect(parseSkillCsv('').errors[0].message).toBe('The file is empty');
  });

  it('reports rows without code or name with their line number', () => {
    const result = parseSkillCsv('code,name\n,No code\nX.1,\nX.2,Fine');

    expect(result.errors).toEqual([
      { line: 2, code: null, message: 'Code is required' },
      { line: 3, code: 'X.1', message: 'Name is required' }
    ]);
    expect(result.rows).toHaveLength(1);
  });
});

describe('previewSkillImport', () => {
  const parse = (text: string) => parseSkillCsv(text);

  it('marks creates and updates and orders parents first', () => {
    const preview = previewSkillImport(parse('code,name,parent_code\nB,Child,A\nA,Root,\nC,Existing,'), [
      { code: 'C', parentCode: null }
    ]);

    expect(preview.errors).toEqual([]);
    expect(preview.rows.map((row) => [row.code, row.action])).toEqual([
      ['A', 'create'],
      ['B', 'create'],
      ['C', 'update']
    ]);
  });

  it('accepts a parent that already exists in the organisation', () => {
    const preview = previewSkillImport(parse('code,name,parent_code\nB,Child,A'), [{ code: 'A', parentCode: null }]);

    expect(preview.errors).toEqual([]);
    expect(preview.rows).toHaveLength(1);
  });

  it('reports duplicates, unknown parents and self parents', () => {
    const preview = previewSkillImport(parse('code,name,parent_code\nA,One,\nA,Two,\nB,Three,ZZ\nC,Four,C'), []);

    expect(preview.errors.map((error) => [error.line, error.message])).toEqual([
      [3, 'Duplicate code in this file'],
      [4, 'Unknown parent code ZZ'],
      [5, 'A skill cannot be its own parent']
    ]);
    expect(preview.rows.map((row) => row.code)).toEqual(['A']);
  });

  it('detects parent cycles', () => {
    const preview = previewSkillImport(parse('code,name,parent_code\nA,One,B\nB,Two,A'), []);

    expect(preview.errors.some((error) => error.message === 'Parent codes form a cycle')).toBe(true);
    expect(preview.rows).toEqual([]);
  });

  it('detects a cycle through an existing skill', () => {
    const preview = previewSkillImport(parse('code,name,parent_code\nA,One,B'), [{ code: 'B', parentCode: 'A' }]);

    expect(preview.errors.some((error) => error.message === 'Parent codes form a cycle')).toBe(true);
  });
});

describe('starter sets', () => {
  it('parse cleanly and import without errors', () => {
    expect(SKILL_STARTER_SETS.map((set) => set.id)).toEqual(['common-core', 'waec-neco', 'uk-national-curriculum']);

    for (const set of SKILL_STARTER_SETS) {
      const preview = previewSkillImport(parseSkillCsv(set.csv), []);

      expect(preview.errors).toEqual([]);
      expect(preview.rows.length).toBeGreaterThan(5);
      expect(preview.rows.every((row) => row.framework === set.framework)).toBe(true);
    }
  });

  it('keeps WAEC/NECO and UK sets to top-level strands', () => {
    for (const id of ['waec-neco', 'uk-national-curriculum']) {
      const set = SKILL_STARTER_SETS.find((candidate) => candidate.id === id)!;

      expect(parseSkillCsv(set.csv).rows.every((row) => row.parentCode === null)).toBe(true);
    }
  });

  it('round-trips through skillRowsToCsv', () => {
    const csv = skillRowsToCsv([{ code: 'A', name: 'Say "x", y', framework: 'F' }]);

    expect(parseSkillCsv(csv).rows[0]).toMatchObject({ name: 'Say "x", y', framework: 'F' });
  });
});
