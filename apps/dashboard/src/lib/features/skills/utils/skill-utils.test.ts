import { describe, expect, it } from 'vitest';

import { buildSkillRows, getDescendantIds } from './skill-utils';
import type { Skill } from './types';

function skill(id: string, code: string, parentId: string | null = null, name = code): Skill {
  return {
    id,
    code,
    name,
    description: null,
    framework: null,
    parentId,
    questionCount: 0,
    createdAt: '',
    updatedAt: ''
  };
}

const skills = [
  skill('c', 'A.2', 'a', 'Equations'),
  skill('a', 'A', null, 'Algebra'),
  skill('b', 'A.1', 'a', 'Exponents'),
  skill('z', 'Z', null, 'Geometry')
];

describe('buildSkillRows', () => {
  it('orders parents before children by code and sets depth', () => {
    expect(buildSkillRows(skills).map((row) => [row.code, row.depth])).toEqual([
      ['A', 0],
      ['A.1', 1],
      ['A.2', 1],
      ['Z', 0]
    ]);
  });

  it('keeps matches with their ancestors', () => {
    expect(buildSkillRows(skills, 'expon').map((row) => row.code)).toEqual(['A', 'A.1']);
  });

  it('treats a missing parent as top level', () => {
    expect(buildSkillRows([skill('x', 'X', 'gone')]).map((row) => row.depth)).toEqual([0]);
  });
});

describe('getDescendantIds', () => {
  it('returns the skill and everything beneath it', () => {
    expect([...getDescendantIds(skills, 'a')].sort()).toEqual(['a', 'b', 'c']);
    expect([...getDescendantIds(skills, 'z')]).toEqual(['z']);
  });
});
