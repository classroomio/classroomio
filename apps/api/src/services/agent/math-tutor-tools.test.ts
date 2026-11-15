import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db', () => ({ db: {} }));
vi.mock('@cio/core/services/lesson/lesson', () => ({ getLesson: vi.fn() }));
vi.mock('@cio/core/services/agent/lesson-transcript', () => ({ getLessonVideoTranscript: vi.fn() }));
vi.mock('@cio/core/services/exercise/exercise', () => ({ getExercise: vi.fn() }));
vi.mock('@cio/core/services/course/section', () => ({ listCourseSections: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ getGroupMemberIdByCourseAndProfile: vi.fn() }));
vi.mock('@cio/db/queries/submission', () => ({ getSubmissionsByCourseIdWithDetails: vi.fn() }));
vi.mock('@cio/core/utils/tinybird', () => ({
  AgentEvent: { TOOL_CALLED: 'tool_called', TOOL_COMPLETED: 'tool_completed' },
  trackAgentEvent: vi.fn()
}));
vi.mock('@cio/core/services/agent/chat-context', () => ({
  verifyExerciseBelongsToCourse: vi.fn(),
  verifyLessonBelongsToCourse: vi.fn()
}));

import { getExercise } from '@cio/core/services/exercise/exercise';
import { QUESTION_TYPE_IDS } from '@cio/question-types';
import type { TAgentCurrentAttempt } from '@cio/utils/validation/agent';
import { buildStudentAgentTools } from './student-tools';

const MATH_ID = QUESTION_TYPE_IDS.MATH_EXPRESSION;
const WORKED_ID = QUESTION_TYPE_IDS.WORKED_SOLUTION;
const NUMERIC_ID = QUESTION_TYPE_IDS.NUMERIC;

const exercise = {
  id: 'exercise-1',
  title: 'Algebra',
  questions: [
    {
      id: 1,
      title: 'Expand $2(x+1)$',
      questionTypeId: MATH_ID,
      points: 1,
      order: 1,
      settings: { acceptedAnswers: ['2x+2'] },
      options: []
    },
    {
      id: 2,
      title: 'Solve $2x+3=11$',
      questionTypeId: WORKED_ID,
      points: 4,
      order: 2,
      settings: { acceptedAnswers: ['x=4'], answerPoints: 2 },
      options: []
    },
    {
      id: 3,
      title: 'What is $\\frac{1}{2}+\\frac{1}{4}$?',
      questionTypeId: NUMERIC_ID,
      points: 1,
      order: 3,
      settings: { correctValue: 0.75 },
      options: []
    }
  ]
};

type AssessmentMode = 'direct_answer' | 'hint_only' | 'block_during_exercise';

function buildTools(assessmentMode: AssessmentMode, currentAttempt?: TAgentCurrentAttempt) {
  return buildStudentAgentTools('org-1', 'profile-1', 'course-1', { assessmentMode } as never, {
    exerciseId: 'exercise-1',
    currentAttempt
  });
}

async function run<
  TName extends 'read_current_attempt' | 'check_math_answer' | 'check_math_step' | 'compare_math_expressions'
>(toolSet: ReturnType<typeof buildTools>, name: TName, args: Record<string, unknown> = {}) {
  const execute = toolSet[name].execute as
    | ((input: unknown, options: unknown) => Promise<Record<string, unknown>>)
    | undefined;
  if (!execute) throw new Error(name + ' has no execute function');

  return execute(args, {});
}

describe('tutor math tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getExercise).mockResolvedValue(exercise as unknown as Awaited<ReturnType<typeof getExercise>>);
  });

  it('reads the current question and input without exposing the answer key', async () => {
    const tools = buildTools('hint_only', { questionId: 1, answer: { type: 'MATH_EXPRESSION', latex: '2x+1' } });
    const result = await run(tools, 'read_current_attempt');

    expect(result).toMatchObject({
      available: true,
      question: { id: 1, question: 'Expand $2(x+1)$' },
      currentInput: { latex: '2x+1' },
      assessmentMode: 'hint_only'
    });
    expect(JSON.stringify(result)).not.toContain('acceptedAnswers');
    expect(JSON.stringify(result)).not.toContain('2x+2');
  });

  it('reports no attempt when the chat sent none or the question is not in the exercise', async () => {
    expect(await run(buildTools('hint_only'), 'read_current_attempt')).toMatchObject({ available: false });
    expect(await run(buildTools('hint_only', { questionId: 99 }), 'check_math_answer')).toMatchObject({
      available: false
    });
  });

  it('answers "is this right?" with the engine and names the slip in hint-only mode', async () => {
    const wrong = buildTools('hint_only', { questionId: 1, answer: { type: 'MATH_EXPRESSION', latex: '2x+1' } });
    const result = await run(wrong, 'check_math_answer');

    expect(result).toMatchObject({ checked: true, isCorrect: false, reason: 'wrong' });
    expect(String(result.misconceptionHint)).toContain('brackets');
    expect(String(result.guidance)).toContain('Do not give the answer');
    expect(JSON.stringify(result)).not.toContain('2x+2');
  });

  it('confirms a correct answer written in another equivalent form', async () => {
    const tools = buildTools('hint_only', { questionId: 1, answer: { type: 'MATH_EXPRESSION', latex: '2(x+1)' } });

    expect(await run(tools, 'check_math_answer')).toMatchObject({
      checked: true,
      isCorrect: true,
      reason: 'equivalent'
    });
  });

  it('grades a numeric fraction typed as LaTeX', async () => {
    const right = buildTools('hint_only', { questionId: 3, answer: { type: 'NUMERIC', latex: '\\frac{3}{4}' } });
    const wrong = buildTools('hint_only', { questionId: 3, answer: { type: 'NUMERIC', latex: '\\frac{2}{3}' } });

    expect(await run(right, 'check_math_answer')).toMatchObject({ isCorrect: true });
    expect(await run(wrong, 'check_math_answer')).toMatchObject({ isCorrect: false });
  });

  it('asks the learner to try first when nothing is typed', async () => {
    const tools = buildTools('hint_only', { questionId: 1 });
    const result = await run(tools, 'check_math_answer');

    expect(result).toMatchObject({ checked: false });
    expect(String(result.guidance)).toContain('try the question first');
  });

  it('points to the first incorrect line of the current working', async () => {
    const attempt: TAgentCurrentAttempt = {
      questionId: 2,
      answer: { type: 'WORKED_SOLUTION', latex: 'x=7', working: { lines: ['2x+3=11', '2x=14'] } }
    };
    const result = await run(buildTools('hint_only', attempt), 'check_math_step');

    expect(result).toMatchObject({ firstIncorrectLine: 2 });
    expect(String(result.guidance)).toContain('Do not write the corrected line');
  });

  it('lets the direct-answer tutor show the correction', async () => {
    const result = await run(buildTools('direct_answer'), 'check_math_step', { lines: ['2x+3=11', '2x=14'] });

    expect(result).toMatchObject({ firstIncorrectLine: 2 });
    expect(String(result.guidance)).toContain('you may show the corrected line');
  });

  it('reports consistent working without a wrong line', async () => {
    const result = await run(buildTools('hint_only'), 'check_math_step', { lines: ['2x+3=11', '2x=8', 'x=4'] });

    expect(result).toMatchObject({ firstIncorrectLine: null });
  });

  it('compares two expressions with the engine', async () => {
    const tools = buildTools('hint_only');

    expect(await run(tools, 'compare_math_expressions', { left: '2(x+1)', right: '2x+2' })).toEqual({
      verdict: 'equal'
    });
    expect(await run(tools, 'compare_math_expressions', { left: '2(x+1)', right: '2x+1' })).toEqual({
      verdict: 'different'
    });
  });

  it.each(['check_math_answer', 'check_math_step', 'compare_math_expressions'] as const)(
    'refuses %s while the workspace blocks help during exercises',
    async (name) => {
      const tools = buildTools('block_during_exercise', {
        questionId: 1,
        answer: { type: 'MATH_EXPRESSION', latex: '2x+2' }
      });
      const result = await run(tools, name, { lines: ['x'], left: 'x', right: 'x' });

      expect(result).toMatchObject({ allowed: false });
      expect(String(result.guidance)).toContain('blocks help during an exercise');
    }
  );
});
