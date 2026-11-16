import { describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/skill', () => ({
  listOrganizationSkills: vi.fn(async () => [
    { id: 'id-1', code: 'CCSS.MATH.6.EE.A.1', name: 'Whole-number exponents' },
    { id: 'id-2', code: 'CCSS.MATH.6.EE.B.7', name: 'One-step equations' }
  ])
}));

import { parseSuggestedCodes, suggestSkillsForQuestion } from '@api/services/skill/suggest';

describe('parseSuggestedCodes', () => {
  it('reads a fenced JSON array of objects and strings', () => {
    const reply = '```json\n[{"code":"A","reason":"uses exponents"},"B"]\n```';

    expect(parseSuggestedCodes(reply)).toEqual([
      { code: 'A', reason: 'uses exponents' },
      { code: 'B', reason: '' }
    ]);
  });

  it('returns nothing for text without an array or with broken JSON', () => {
    expect(parseSuggestedCodes('no idea')).toEqual([]);
    expect(parseSuggestedCodes('[{"code": ]')).toEqual([]);
  });
});

describe('suggestSkillsForQuestion', () => {
  const input = { courseId: '11111111-1111-4111-8111-111111111111', title: 'Solve $x+3=5$', limit: 5 };

  it('sends the catalogue and question to the model and keeps only known codes', async () => {
    const generate = vi.fn(
      async () => '[{"code":"ccss.math.6.ee.b.7","reason":"one step"},{"code":"MADE.UP","reason":"x"}]'
    );

    const suggestions = await suggestSkillsForQuestion('org', input, generate);

    expect(suggestions).toEqual([
      { skillId: 'id-2', code: 'CCSS.MATH.6.EE.B.7', name: 'One-step equations', reason: 'one step' }
    ]);
    const call = generate.mock.calls[0] as unknown as [{ prompt: string }];
    expect(call[0].prompt).toContain('CCSS.MATH.6.EE.A.1 | Whole-number exponents');
    expect(call[0].prompt).toContain('Solve $x+3=5$');
  });

  it('drops duplicates and honours the limit', async () => {
    const generate = async () => '["CCSS.MATH.6.EE.A.1","CCSS.MATH.6.EE.A.1","CCSS.MATH.6.EE.B.7"]';

    const suggestions = await suggestSkillsForQuestion('org', { ...input, limit: 1 }, generate);

    expect(suggestions.map((suggestion) => suggestion.skillId)).toEqual(['id-1']);
  });
});
