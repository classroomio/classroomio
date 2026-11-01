import { describe, expect, it } from 'vitest';

import { CHECK_IN_CODE_ALPHABET, CHECK_IN_CODE_LENGTH } from '@cio/utils/constants/attendance';

import {
  buildCheckInQrPayload,
  checkInCodesMatch,
  checkInStatusAt,
  generateCheckInCode,
  mergeCheckInStatus
} from '../check-in-code';

const lessonAt = '2026-11-01T11:00:00.000Z';

describe('generateCheckInCode', () => {
  it('uses the fixed length and only unambiguous characters', () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const code = generateCheckInCode();

      expect(code).toHaveLength(CHECK_IN_CODE_LENGTH);
      for (const character of code) {
        expect(CHECK_IN_CODE_ALPHABET).toContain(character);
      }
      expect(code).not.toMatch(/[01OIL]/);
    }
  });
});

describe('checkInCodesMatch', () => {
  it('ignores case', () => {
    expect(checkInCodesMatch('AB23CD', 'ab23cd')).toBe(true);
  });

  it('rejects a different or shorter code', () => {
    expect(checkInCodesMatch('AB23CD', 'AB23CE')).toBe(false);
    expect(checkInCodesMatch('AB23CD', 'AB23C')).toBe(false);
  });
});

describe('checkInStatusAt', () => {
  it('is present up to ten minutes after the start', () => {
    expect(checkInStatusAt(lessonAt, new Date('2026-11-01T10:50:00.000Z'))).toBe('present');
    expect(checkInStatusAt(lessonAt, new Date('2026-11-01T11:10:00.000Z'))).toBe('present');
  });

  it('is late after ten minutes', () => {
    expect(checkInStatusAt(lessonAt, new Date('2026-11-01T11:10:01.000Z'))).toBe('late');
  });

  it('is present when the lesson has no start time', () => {
    expect(checkInStatusAt(null, new Date('2026-11-01T11:30:00.000Z'))).toBe('present');
  });
});

describe('mergeCheckInStatus', () => {
  it('never downgrades a learner already marked present', () => {
    expect(mergeCheckInStatus('present', 'late')).toBe('present');
  });

  it('replaces absent or missing records with the check-in status', () => {
    expect(mergeCheckInStatus('absent', 'late')).toBe('late');
    expect(mergeCheckInStatus(null, 'present')).toBe('present');
    expect(mergeCheckInStatus('late', 'present')).toBe('present');
  });
});

describe('buildCheckInQrPayload', () => {
  it('encodes the lesson and code as a deep link', () => {
    expect(buildCheckInQrPayload('lesson-1', 'AB23CD')).toBe('classroomio://check-in?lesson=lesson-1&code=AB23CD');
  });
});
