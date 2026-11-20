import { describe, expect, it } from 'vitest';

import { computeSkillMastery, masteryLevelFor, SKILL_MASTERY_CONFIG } from '../src/skill-mastery';

const day = (offset: number) => new Date(Date.UTC(2026, 10, 1 + offset)).toISOString();

describe('computeSkillMastery', () => {
  it('is not started without attempts', () => {
    expect(computeSkillMastery([])).toEqual({ level: 'not_started', score: null, evidenceCount: 0 });
  });

  it('stays at learning below the minimum evidence even for perfect answers', () => {
    const result = computeSkillMastery([
      { ratio: 1, attemptedAt: day(0) },
      { ratio: 1, attemptedAt: day(1) }
    ]);

    expect(result).toEqual({ level: 'learning', score: 100, evidenceCount: 2 });
  });

  it('needs five attempts to be mastered', () => {
    const three = [0, 1, 2].map((offset) => ({ ratio: 1, attemptedAt: day(offset) }));
    const five = [0, 1, 2, 3, 4].map((offset) => ({ ratio: 1, attemptedAt: day(offset) }));

    expect(computeSkillMastery(three).level).toBe('proficient');
    expect(computeSkillMastery(five).level).toBe('mastered');
  });

  it('weights newer attempts more, regardless of input order', () => {
    const improving = [
      { ratio: 1, attemptedAt: day(5) },
      { ratio: 0, attemptedAt: day(0) },
      { ratio: 0, attemptedAt: day(1) },
      { ratio: 1, attemptedAt: day(4) },
      { ratio: 1, attemptedAt: day(3) }
    ];
    const result = computeSkillMastery(improving);

    expect(result.score).toBeCloseTo(((1 + 0.8 + 0.64) / (1 + 0.8 + 0.64 + 0.512 + 0.4096)) * 100, 0);
    expect(result.level).toBe('proficient');
  });

  it('only counts the most recent attempts', () => {
    const attempts = Array.from({ length: SKILL_MASTERY_CONFIG.recentAttempts + 5 }, (_, offset) => ({
      ratio: offset < 5 ? 0 : 1,
      attemptedAt: day(offset)
    }));
    const result = computeSkillMastery(attempts);

    expect(result.evidenceCount).toBe(SKILL_MASTERY_CONFIG.recentAttempts);
    expect(result.score).toBe(100);
    expect(result.level).toBe('mastered');
  });

  it('keeps struggling students at learning', () => {
    const attempts = [0, 1, 2, 3].map((offset) => ({ ratio: 0.25, attemptedAt: day(offset) }));

    expect(computeSkillMastery(attempts)).toMatchObject({ level: 'learning', score: 25 });
  });

  it('clamps ratios to the range 0 to 1', () => {
    expect(computeSkillMastery([{ ratio: 3, attemptedAt: day(0) }]).score).toBe(100);
    expect(computeSkillMastery([{ ratio: -1, attemptedAt: day(0) }]).score).toBe(0);
  });
});

describe('masteryLevelFor', () => {
  it('applies the thresholds at their boundaries', () => {
    expect(masteryLevelFor(59.9, 6)).toBe('learning');
    expect(masteryLevelFor(60, 6)).toBe('proficient');
    expect(masteryLevelFor(84.9, 6)).toBe('proficient');
    expect(masteryLevelFor(85, 6)).toBe('mastered');
    expect(masteryLevelFor(85, 4)).toBe('proficient');
    expect(masteryLevelFor(null, 0)).toBe('not_started');
  });
});
