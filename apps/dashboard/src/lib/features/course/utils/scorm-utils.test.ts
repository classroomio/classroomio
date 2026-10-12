import { describe, expect, it } from 'vitest';

import {
  completionRuleLabel,
  formatDuration,
  formatPackageBytes,
  formatScorePercent,
  formatScormVersion,
  unitPassMark
} from './scorm-utils';

describe('formatScormVersion', () => {
  it('labels known formats', () => {
    expect(formatScormVersion('scorm12')).toBe('SCORM 1.2');
    expect(formatScormVersion('scorm2004_4')).toBe('SCORM 2004');
  });

  it('falls back to SCORM for unknown formats', () => {
    expect(formatScormVersion(null)).toBe('SCORM');
    expect(formatScormVersion('cmi5')).toBe('SCORM');
  });
});

describe('formatPackageBytes', () => {
  it('formats binary units', () => {
    expect(formatPackageBytes(0)).toBe('0 Bytes');
    expect(formatPackageBytes(1536)).toBe('1.5 KB');
    expect(formatPackageBytes(500 * 1024 * 1024)).toBe('500 MB');
  });

  it('renders missing sizes as an em dash', () => {
    expect(formatPackageBytes(null)).toBe('—');
    expect(formatPackageBytes(-1)).toBe('—');
  });
});

describe('completionRuleLabel', () => {
  it('labels every rule and defaults unknown rules to automatic', () => {
    expect(completionRuleLabel('score')).toBe('Minimum score');
    expect(completionRuleLabel('bogus')).toBe('Automatic');
  });
});

describe('unitPassMark', () => {
  it('reads SCORM 1.2 mastery scores and 2004 scaled scores', () => {
    expect(unitPassMark({ masteryScore: '80' })).toBe(80);
    expect(unitPassMark({ formatDetails: { scaledPassingScore: 0.8 } })).toBe(80);
  });

  it('returns null without a pass mark', () => {
    expect(unitPassMark({})).toBeNull();
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes and hours compactly', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(185)).toBe('3m 05s');
    expect(formatDuration(7260)).toBe('2h 1m');
  });

  it('renders missing time as an em dash', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(-5)).toBe('—');
  });
});

describe('formatScorePercent', () => {
  it('renders percents and dashes for missing scores', () => {
    expect(formatScorePercent(90)).toBe('90%');
    expect(formatScorePercent(null)).toBe('—');
  });
});
