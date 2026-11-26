import { describe, expect, it } from 'vitest';
import { ContentType } from '@cio/utils/constants/content';
import {
  countRequirements,
  getRequirementPolicy,
  hasOptionalItem,
  isContentRequired,
  isRequirementTarget
} from './content-requirement-utils';

describe('isContentRequired', () => {
  it('treats the none policy as optional and every other policy as required', () => {
    expect(isContentRequired({ completionPolicy: 'none' })).toBe(false);
    expect(isContentRequired({ completionPolicy: 'manual' })).toBe(true);
    expect(isContentRequired({ completionPolicy: 'video_watch' })).toBe(true);
    expect(isContentRequired({ completionPolicy: 'submitted' })).toBe(true);
    expect(isContentRequired({ completionPolicy: 'passed' })).toBe(true);
  });

  it('treats a missing policy as required', () => {
    expect(isContentRequired({ completionPolicy: null })).toBe(true);
    expect(isContentRequired({})).toBe(true);
  });
});

describe('getRequirementPolicy', () => {
  it('maps optional to none for lessons and exercises', () => {
    expect(getRequirementPolicy(ContentType.Lesson, false)).toBe('none');
    expect(getRequirementPolicy(ContentType.Exercise, false)).toBe('none');
  });

  it('maps required to each content type default policy', () => {
    expect(getRequirementPolicy(ContentType.Lesson, true)).toBe('manual');
    expect(getRequirementPolicy(ContentType.Exercise, true)).toBe('submitted');
  });
});

describe('isRequirementTarget', () => {
  it('accepts lessons and exercises only', () => {
    expect(isRequirementTarget({ type: ContentType.Lesson })).toBe(true);
    expect(isRequirementTarget({ type: ContentType.Exercise })).toBe(true);
    expect(isRequirementTarget({ type: ContentType.Section })).toBe(false);
  });
});

describe('countRequirements', () => {
  const items = [
    { type: ContentType.Lesson, completionPolicy: 'manual', isComplete: true },
    { type: ContentType.Lesson, completionPolicy: 'none', isComplete: true },
    { type: ContentType.Exercise, completionPolicy: 'submitted', isComplete: false },
    { type: ContentType.Exercise, completionPolicy: 'none', isComplete: false },
    { type: ContentType.Section, completionPolicy: null, isComplete: false }
  ];

  it('counts required, optional and completed required items from the completion policy', () => {
    expect(countRequirements(items)).toEqual({ total: 4, required: 2, optional: 2, requiredDone: 1 });
  });

  it('detects whether any lesson or exercise is optional', () => {
    expect(hasOptionalItem(items)).toBe(true);
    expect(hasOptionalItem(items.filter((item) => item.completionPolicy !== 'none'))).toBe(false);
  });
});
