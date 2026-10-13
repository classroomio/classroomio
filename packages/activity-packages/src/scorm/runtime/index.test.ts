import { describe, expect, it } from 'vitest';
import { PackageError } from '../../errors.js';
import type { ScormPackageUnit } from '../manifest/index.js';
import {
  applyLmsRules,
  averageScaledScore,
  flattenCmi,
  isScormRuleMet,
  mapScorm2004Outcome,
  mapScorm12Outcome,
  mergeCmi,
  moduleOutcomeFromCmi,
  normalizeCmiShape,
  normalizeCommitCmi,
  shouldRecordCommitEvent,
  statusAfterTerminate,
  summarizeInteractions,
  type ScormCmi,
  type ScormCommitOutcomeSnapshot,
  type ScormCommitRecordContext,
  type ScormModuleOutcome
} from './index.js';

function unit(overrides: Partial<ScormPackageUnit> = {}): ScormPackageUnit {
  return {
    identifier: 'ITEM-1',
    parentIdentifier: null,
    title: 'SCO',
    position: 0,
    unitType: 'sco',
    href: 'sco.html',
    parameters: null,
    masteryScoreRaw: null,
    passingScoreScaled: null,
    completionThreshold: null,
    launchData: null,
    formatDetails: { format: 'scorm12' },
    isVisible: true,
    ...overrides
  };
}

function outcome(overrides: Partial<ScormModuleOutcome> = {}): ScormModuleOutcome {
  return { completion: 'incomplete', success: 'unknown', hasPassMark: false, scaledScore: null, ...overrides };
}

describe('mapScorm12Outcome', () => {
  it('maps every status value', () => {
    expect(mapScorm12Outcome('passed')).toEqual({ completion: 'completed', success: 'passed' });
    expect(mapScorm12Outcome('completed')).toEqual({ completion: 'completed', success: 'unknown' });
    expect(mapScorm12Outcome('failed')).toEqual({ completion: 'completed', success: 'failed' });
    expect(mapScorm12Outcome('incomplete')).toEqual({ completion: 'incomplete', success: 'unknown' });
    expect(mapScorm12Outcome('browsed')).toEqual({ completion: 'incomplete', success: 'unknown' });
    expect(mapScorm12Outcome('not attempted')).toEqual({ completion: 'not_attempted', success: 'unknown' });
    expect(mapScorm12Outcome('')).toEqual({ completion: 'not_attempted', success: 'unknown' });
    expect(mapScorm12Outcome('weird')).toEqual({ completion: 'unknown', success: 'unknown' });
  });
});

describe('mapScorm2004Outcome', () => {
  it('passes stored values through', () => {
    expect(mapScorm2004Outcome('completed', 'passed')).toEqual({ completion: 'completed', success: 'passed' });
    expect(mapScorm2004Outcome('incomplete', 'failed')).toEqual({ completion: 'incomplete', success: 'failed' });
    expect(mapScorm2004Outcome('', '')).toEqual({ completion: 'not_attempted', success: 'unknown' });
    expect(mapScorm2004Outcome('weird', 'odd')).toEqual({ completion: 'unknown', success: 'unknown' });
  });
});

describe('moduleOutcomeFromCmi', () => {
  it('scales 1.2 raw scores and reads pass marks', () => {
    const plain = moduleOutcomeFromCmi(
      { core: { lesson_status: 'completed', score: { raw: 80 } } },
      'scorm12',
      unit({ masteryScoreRaw: 80 })
    );

    expect(plain).toEqual({ completion: 'completed', success: 'unknown', hasPassMark: true, scaledScore: 0.8 });

    const ranged = moduleOutcomeFromCmi(
      { core: { lesson_status: 'completed', score: { raw: 6, min: 0, max: 10 } } },
      'scorm12',
      unit()
    );

    expect(ranged.scaledScore).toBe(0.6);
    expect(ranged.hasPassMark).toBe(false);
  });

  it('reads 2004 scaled scores and passing scores', () => {
    const graded = moduleOutcomeFromCmi(
      { completion_status: 'completed', success_status: 'passed', score: { scaled: '0.9' } },
      'scorm2004_4',
      unit({ passingScoreScaled: 0.8 })
    );

    expect(graded).toEqual({ completion: 'completed', success: 'passed', hasPassMark: true, scaledScore: 0.9 });
  });
});

describe('applyLmsRules', () => {
  it('completes a 1.2 finish that never set a status', () => {
    const finished = applyLmsRules({ core: { exit: '' } }, unit(), 'scorm12', { terminated: true });

    expect(finished).toMatchObject({ core: { lesson_status: 'completed' } });

    const suspended = applyLmsRules({ core: { exit: 'suspend' } }, unit(), 'scorm12', { terminated: true });

    expect((suspended['core'] as ScormCmi)['lesson_status']).toBeUndefined();

    const untouched = applyLmsRules({ core: { lesson_status: 'incomplete' } }, unit(), 'scorm12', {
      terminated: true
    });

    expect(untouched).toMatchObject({ core: { lesson_status: 'incomplete' } });

    const notTerminated = applyLmsRules({ core: {} }, unit(), 'scorm12', { terminated: false });

    expect((notTerminated['core'] as ScormCmi)['lesson_status']).toBeUndefined();
  });

  it('overrides 1.2 status from the mastery score', () => {
    const passed = applyLmsRules({ core: { score: { raw: 85 } } }, unit({ masteryScoreRaw: 80 }), 'scorm12', {
      terminated: false
    });

    expect(passed).toMatchObject({ core: { lesson_status: 'passed' } });

    const failed = applyLmsRules(
      { core: { lesson_status: 'completed', score: { raw: 60 } } },
      unit({ masteryScoreRaw: 80 }),
      'scorm12',
      { terminated: false }
    );

    expect(failed).toMatchObject({ core: { lesson_status: 'failed' } });

    const emptyCredit = applyLmsRules(
      { core: { credit: '', score: { raw: 90 } } },
      unit({ masteryScoreRaw: 80 }),
      'scorm12',
      { terminated: false }
    );

    expect(emptyCredit).toMatchObject({ core: { lesson_status: 'passed' } });

    const noCredit = applyLmsRules(
      { core: { credit: 'no-credit', score: { raw: 95 } } },
      unit({ masteryScoreRaw: 80 }),
      'scorm12',
      { terminated: false }
    );

    expect((noCredit['core'] as ScormCmi)['lesson_status']).toBeUndefined();
  });

  it('completes a 2004 finish that never set a status', () => {
    const finished = applyLmsRules({ exit: '' }, unit(), 'scorm2004_4', { terminated: true });

    expect(finished).toMatchObject({ completion_status: 'completed' });

    const suspended = applyLmsRules({ exit: 'suspend' }, unit(), 'scorm2004_4', { terminated: true });

    expect(suspended['completion_status']).toBeUndefined();

    const untouched = applyLmsRules({ completion_status: 'incomplete' }, unit(), 'scorm2004_4', {
      terminated: true
    });

    expect(untouched).toMatchObject({ completion_status: 'incomplete' });

    const notTerminated = applyLmsRules({}, unit(), 'scorm2004_4', { terminated: false });

    expect(notTerminated['completion_status']).toBeUndefined();
  });

  it('evaluates 2004 thresholds on terminate only', () => {
    const graded = unit({ passingScoreScaled: 0.8, completionThreshold: 0.6 });
    const cmi: ScormCmi = { progress_measure: '0.7', score: { scaled: '0.9' } };

    expect(applyLmsRules(cmi, graded, 'scorm2004_4', { terminated: true })).toMatchObject({
      completion_status: 'completed',
      success_status: 'passed'
    });
    expect(applyLmsRules(cmi, graded, 'scorm2004_4', { terminated: false })).toEqual(cmi);

    const short: ScormCmi = { progress_measure: '0.2', score: { scaled: '0.4' } };

    expect(applyLmsRules(short, graded, 'scorm2004_4', { terminated: true })).toMatchObject({
      completion_status: 'incomplete',
      success_status: 'failed'
    });
  });
});

describe('mergeCmi and normalizeCommitCmi', () => {
  it('merges changed fields over stored state', () => {
    const stored: ScormCmi = { core: { lesson_status: 'incomplete' }, suspend_data: 'bookmark=3' };
    const merged = mergeCmi(stored, { core: { lesson_location: 'page-4' } });

    expect(merged).toEqual({
      core: { lesson_status: 'incomplete', lesson_location: 'page-4' },
      suspend_data: 'bookmark=3'
    });
    expect(stored).toEqual({ core: { lesson_status: 'incomplete' }, suspend_data: 'bookmark=3' });
  });

  it('normalizes flat dotted commits and validates envelopes', () => {
    const normalized = normalizeCommitCmi({
      seq: '3',
      cmi: { 'core.lesson_status': 'completed', 'core.exit': '' },
      terminate: true
    });

    expect(normalized).toEqual({
      seq: 3,
      cmi: { core: { lesson_status: 'completed', exit: '' } },
      terminate: true
    });

    const sequenced = normalizeCommitCmi({
      commitSequence: 7,
      cmi: { core: { lesson_status: 'incomplete' } }
    });

    expect(sequenced).toEqual({ seq: 7, cmi: { core: { lesson_status: 'incomplete' } }, terminate: false });

    const rooted = normalizeCommitCmi({
      seq: 4,
      cmi: { cmi: { core: { lesson_status: 'completed' } } },
      terminate: false
    });

    expect(rooted.cmi).toEqual({ core: { lesson_status: 'completed' } });

    for (const bad of [
      null,
      { seq: -1, cmi: {}, terminate: false },
      { seq: 1, cmi: null, terminate: false },
      { seq: 1, cmi: {}, terminate: 'yes' },
      { cmi: { core: {} } }
    ]) {
      try {
        normalizeCommitCmi(bad);
        expect.unreachable();
      } catch (error) {
        expect((error as PackageError).code).toBe('invalid_commit');
      }
    }
  });

  it('flattens stored CMI for players', () => {
    expect(flattenCmi({ core: { lesson_status: 'completed' }, suspend_data: 'x' })).toEqual({
      'core.lesson_status': 'completed',
      suspend_data: 'x'
    });
    expect(normalizeCmiShape(flattenCmi({ core: { score: { raw: '80' } } }))).toEqual({
      core: { score: { raw: '80' } }
    });
  });
});

describe('isScormRuleMet', () => {
  it('rolls one module and three modules up', () => {
    expect(isScormRuleMet({ rule: 'auto' }, [])).toBe(false);
    expect(isScormRuleMet({ rule: 'auto' }, [outcome({ completion: 'completed' })])).toBe(true);
    expect(isScormRuleMet({ rule: 'passed' }, [outcome({ completion: 'completed' })])).toBe(false);
  });

  it('settles graded modules from pass or fail, not completion', () => {
    const modules = [
      outcome({ completion: 'completed' }),
      outcome({ completion: 'completed', success: 'failed', hasPassMark: true })
    ];

    expect(isScormRuleMet({ rule: 'auto' }, modules)).toBe(false);
    expect(
      isScormRuleMet(
        { rule: 'auto' },
        modules.map((module, index) =>
          index === 1 ? outcome({ completion: 'completed', success: 'passed', hasPassMark: true }) : module
        )
      )
    ).toBe(true);
  });

  it('completes in any module order', () => {
    const done = outcome({ completion: 'completed' });
    const todo = outcome({});

    expect(isScormRuleMet({ rule: 'auto' }, [done, todo, done])).toBe(false);
    expect(isScormRuleMet({ rule: 'auto' }, [done, done, done])).toBe(true);
  });

  it('averages the score rule over modules that report one', () => {
    const modules = [
      outcome({ completion: 'completed', scaledScore: 1.0 }),
      outcome({ completion: 'completed', scaledScore: null }),
      outcome({ completion: 'completed', scaledScore: 0.6 })
    ];

    expect(averageScaledScore(modules)).toBeCloseTo(0.8);
    expect(isScormRuleMet({ rule: 'score', minScorePercent: 80 }, modules)).toBe(true);
    expect(isScormRuleMet({ rule: 'score', minScorePercent: 81 }, modules)).toBe(false);
    expect(isScormRuleMet({ rule: 'score', minScorePercent: 50 }, [outcome({ completion: 'completed' })])).toBe(false);
  });
});

describe('statusAfterTerminate', () => {
  it('suspends on suspend in both versions', () => {
    expect(statusAfterTerminate({ core: { exit: 'suspend' } }, 'scorm12')).toBe('suspended');
    expect(statusAfterTerminate({ exit: 'suspend' }, 'scorm2004_4')).toBe('suspended');
  });

  it('closes finished 1.2 modules and resumes unfinished ones', () => {
    for (const status of ['passed', 'completed', 'failed']) {
      expect(statusAfterTerminate({ core: { lesson_status: status, exit: '' } }, 'scorm12')).toBe('closed');
    }

    for (const exit of ['', 'logout', undefined]) {
      expect(statusAfterTerminate({ core: { lesson_status: 'incomplete', exit } }, 'scorm12')).toBe('suspended');
    }
  });

  it('starts 2004 modules fresh after any other exit', () => {
    for (const exit of ['', 'normal', 'logout', 'time-out']) {
      expect(statusAfterTerminate({ exit }, 'scorm2004_4')).toBe('closed');
    }
  });
});

describe('summarizeInteractions', () => {
  it('reads 1.2 answers from the keyed-object form', () => {
    const summarized = summarizeInteractions({
      core: { lesson_status: 'completed' },
      interactions: {
        '0': {
          id: 'Q1',
          type: 'choice',
          student_response: 'a',
          result: 'correct',
          latency: '00:00:05',
          correct_responses: { '0': { pattern: 'a' } }
        },
        '1': {
          id: 'Q2',
          type: 'true-false',
          student_response: 'true',
          result: 'wrong',
          latency: '00:00:03',
          correct_responses: { '0': { pattern: 'false' } }
        }
      }
    });

    expect(summarized).toEqual([
      {
        index: 0,
        id: 'Q1',
        type: 'choice',
        studentResponse: 'a',
        result: 'correct',
        latency: '00:00:05',
        description: null,
        correctResponse: 'a'
      },
      {
        index: 1,
        id: 'Q2',
        type: 'true-false',
        studentResponse: 'true',
        result: 'wrong',
        latency: '00:00:03',
        description: null,
        correctResponse: 'false'
      }
    ]);
  });

  it('reads 2004 questions with descriptions and correct patterns', () => {
    const summarized = summarizeInteractions({
      completion_status: 'completed',
      interactions: [
        {
          id: 'Q1',
          type: 'choice',
          learner_response: 'a[,]b',
          result: 'correct',
          latency: 'PT5S',
          timestamp: '2026-10-13T10:00:00',
          description: 'What counts as PHI?',
          correct_responses: [{ pattern: 'a[,]b' }]
        }
      ]
    });

    expect(summarized).toEqual([
      {
        index: 0,
        id: 'Q1',
        type: 'choice',
        studentResponse: 'a[,]b',
        result: 'correct',
        latency: 'PT5S',
        description: 'What counts as PHI?',
        correctResponse: 'a[,]b'
      }
    ]);
  });

  it('returns nothing for empty or count-only interactions', () => {
    expect(summarizeInteractions({})).toEqual([]);
    expect(summarizeInteractions({ interactions: { _count: '2' } })).toEqual([]);
  });
});

describe('shouldRecordCommitEvent', () => {
  function snapshot(overrides: Partial<ScormCommitOutcomeSnapshot> = {}): ScormCommitOutcomeSnapshot {
    return {
      completion: 'incomplete',
      success: 'unknown',
      scaledScore: null,
      tryStatus: 'active',
      ...overrides
    };
  }

  function context(overrides: Partial<ScormCommitRecordContext> = {}): ScormCommitRecordContext {
    return { isFirstCommit: false, isTerminate: false, isBeacon: false, isRejected: false, ...overrides };
  }

  it('drops routine autocommits with no outcome or status change', () => {
    expect(shouldRecordCommitEvent(snapshot(), snapshot(), context())).toBe(false);
    expect(
      shouldRecordCommitEvent(
        snapshot({ completion: 'incomplete', scaledScore: null }),
        snapshot({ completion: 'incomplete', scaledScore: null }),
        context()
      )
    ).toBe(false);
  });

  it('records the first commit of a module try', () => {
    expect(shouldRecordCommitEvent(snapshot(), snapshot(), context({ isFirstCommit: true }))).toBe(true);
  });

  it('records completion status changes', () => {
    expect(
      shouldRecordCommitEvent(snapshot({ completion: 'incomplete' }), snapshot({ completion: 'completed' }), context())
    ).toBe(true);
  });

  it('records success status changes', () => {
    expect(shouldRecordCommitEvent(snapshot({ success: 'unknown' }), snapshot({ success: 'passed' }), context())).toBe(
      true
    );
    expect(shouldRecordCommitEvent(snapshot({ success: 'unknown' }), snapshot({ success: 'failed' }), context())).toBe(
      true
    );
  });

  it('records score changes', () => {
    expect(shouldRecordCommitEvent(snapshot({ scaledScore: null }), snapshot({ scaledScore: 0.8 }), context())).toBe(
      true
    );
    expect(shouldRecordCommitEvent(snapshot({ scaledScore: 0.8 }), snapshot({ scaledScore: 0.9 }), context())).toBe(
      true
    );
  });

  it('records try status changes', () => {
    expect(
      shouldRecordCommitEvent(snapshot({ tryStatus: 'active' }), snapshot({ tryStatus: 'suspended' }), context())
    ).toBe(true);
    expect(
      shouldRecordCommitEvent(snapshot({ tryStatus: 'suspended' }), snapshot({ tryStatus: 'closed' }), context())
    ).toBe(true);
  });

  it('records terminate commits even without an outcome change', () => {
    expect(shouldRecordCommitEvent(snapshot(), snapshot(), context({ isTerminate: true }))).toBe(true);
  });

  it('records beacon commits even without an outcome change', () => {
    expect(shouldRecordCommitEvent(snapshot(), snapshot(), context({ isBeacon: true }))).toBe(true);
  });

  it('records rejected commits', () => {
    expect(shouldRecordCommitEvent(snapshot(), snapshot(), context({ isRejected: true }))).toBe(true);
  });
});
