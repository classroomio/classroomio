import { describe, expect, it } from 'vitest';
import {
  ANSWER_CODECS,
  extractAnswerDisplayValues,
  fromApiPayload,
  isPluginQuestionSettings,
  QUESTION_TYPE_KEY,
  sanitizePluginQuestionForLearner,
  scoreAnswerForQuestion,
  toApiPayload,
  type ExerciseQuestionModel,
  type PluginCustomAnswerData,
  type PluginQuestionSettingsEnvelope
} from '../src';

describe('plugin question type', () => {
  const validEnvelope: PluginQuestionSettingsEnvelope = {
    pluginId: 'com.classroomio.code-runner',
    installationId: 'inst-12345',
    pluginVersion: '1.0.0',
    artifactDigest: 'sha256-abcdef1234567890',
    contributionId: 'python-runner',
    configVersion: 1,
    publicConfig: {
      starterCode: 'def solve(): pass',
      language: 'python'
    },
    gradingConfig: {
      strategy: 'declarative-match',
      expectedAnswer: { result: 42 }
    }
  };

  const sampleAnswer: PluginCustomAnswerData = {
    type: 'PLUGIN_CUSTOM',
    pluginId: 'com.classroomio.code-runner',
    contributionId: 'python-runner',
    configVersion: 1,
    value: { result: 42 }
  };

  it('validates settings envelope with isPluginQuestionSettings', () => {
    expect(isPluginQuestionSettings({ pluginQuestion: validEnvelope })).toBe(true);
    expect(isPluginQuestionSettings({ pluginQuestion: { ...validEnvelope, pluginId: 123 } })).toBe(false);
    expect(isPluginQuestionSettings({ pluginQuestion: null })).toBe(false);
    expect(isPluginQuestionSettings(null)).toBe(false);
  });

  it('sanitizes gradingConfig for learner projections', () => {
    const rawSettings = {
      description: 'Solve this puzzle',
      pluginQuestion: validEnvelope
    };

    const sanitized = sanitizePluginQuestionForLearner(rawSettings);
    expect(sanitized).toBeDefined();
    expect(sanitized?.description).toBe('Solve this puzzle');
    expect((sanitized?.pluginQuestion as any)?.gradingConfig).toBeUndefined();
    expect((sanitized?.pluginQuestion as any)?.pluginId).toBe('com.classroomio.code-runner');
    expect((sanitized?.pluginQuestion as any)?.publicConfig).toEqual(validEnvelope.publicConfig);
  });

  it('encodes and decodes answer via codec', () => {
    const apiPayload = toApiPayload(sampleAnswer, 42);
    expect(apiPayload.questionId).toBe(42);
    expect(typeof apiPayload.answer).toBe('string');

    const decoded = fromApiPayload(QUESTION_TYPE_KEY.PLUGIN_CUSTOM, apiPayload, {
      id: 42,
      title: 'Coding question',
      questionType: QUESTION_TYPE_KEY.PLUGIN_CUSTOM
    });

    expect(decoded).toEqual(sampleAnswer);
  });

  it('extracts answer display values for summaries', () => {
    const display = extractAnswerDisplayValues(sampleAnswer);
    expect(display.text).toBe(JSON.stringify({ result: 42 }));
  });

  describe('scoring plugin custom questions', () => {
    const question: ExerciseQuestionModel = {
      id: 1,
      title: 'Python problem',
      questionType: QUESTION_TYPE_KEY.PLUGIN_CUSTOM,
      points: 10,
      settings: {
        pluginQuestion: validEnvelope
      }
    };

    it('scores declarative match with exact match', () => {
      const matchingAnswer: PluginCustomAnswerData = {
        type: 'PLUGIN_CUSTOM',
        pluginId: 'com.classroomio.code-runner',
        contributionId: 'python-runner',
        configVersion: 1,
        value: { result: 42 }
      };

      const nonMatchingAnswer: PluginCustomAnswerData = {
        type: 'PLUGIN_CUSTOM',
        pluginId: 'com.classroomio.code-runner',
        contributionId: 'python-runner',
        configVersion: 1,
        value: { result: 99 }
      };

      expect(scoreAnswerForQuestion(question, matchingAnswer)).toBe(10);
      expect(scoreAnswerForQuestion(question, nonMatchingAnswer)).toBe(0);
    });

    it('scores declarative match with regex matchPattern', () => {
      const regexQuestion: ExerciseQuestionModel = {
        id: 2,
        title: 'Regex problem',
        questionType: QUESTION_TYPE_KEY.PLUGIN_CUSTOM,
        points: 5,
        settings: {
          pluginQuestion: {
            ...validEnvelope,
            gradingConfig: {
              strategy: 'declarative-match',
              matchPattern: '^hello\\s+world!*$'
            }
          }
        }
      };

      expect(
        scoreAnswerForQuestion(regexQuestion, {
          type: 'PLUGIN_CUSTOM',
          pluginId: 'p',
          contributionId: 'c',
          configVersion: 1,
          value: 'hello world!!'
        })
      ).toBe(5);

      expect(
        scoreAnswerForQuestion(regexQuestion, {
          type: 'PLUGIN_CUSTOM',
          pluginId: 'p',
          contributionId: 'c',
          configVersion: 1,
          value: 'goodbye world'
        })
      ).toBe(0);
    });

    it('scores declarative match with numeric tolerance', () => {
      const toleranceQuestion: ExerciseQuestionModel = {
        id: 3,
        title: 'Math approximation',
        questionType: QUESTION_TYPE_KEY.PLUGIN_CUSTOM,
        points: 8,
        settings: {
          pluginQuestion: {
            ...validEnvelope,
            gradingConfig: {
              strategy: 'declarative-match',
              expectedAnswer: 3.14159,
              tolerance: 0.01
            }
          }
        }
      };

      expect(
        scoreAnswerForQuestion(toleranceQuestion, {
          type: 'PLUGIN_CUSTOM',
          pluginId: 'p',
          contributionId: 'c',
          configVersion: 1,
          value: 3.14
        })
      ).toBe(8);

      expect(
        scoreAnswerForQuestion(toleranceQuestion, {
          type: 'PLUGIN_CUSTOM',
          pluginId: 'p',
          contributionId: 'c',
          configVersion: 1,
          value: 3.2
        })
      ).toBe(0);
    });

    it('returns 0 for manual grading strategy awaiting teacher review', () => {
      const manualQuestion: ExerciseQuestionModel = {
        id: 4,
        title: 'Essay or open-ended plugin',
        questionType: QUESTION_TYPE_KEY.PLUGIN_CUSTOM,
        points: 10,
        settings: {
          pluginQuestion: {
            ...validEnvelope,
            gradingConfig: {
              strategy: 'manual'
            }
          }
        }
      };

      expect(scoreAnswerForQuestion(manualQuestion, sampleAnswer)).toBe(0);
    });
  });
});
