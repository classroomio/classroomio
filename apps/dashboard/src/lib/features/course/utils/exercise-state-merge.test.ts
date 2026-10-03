import { describe, expect, it } from 'vitest';

import type { QuestionnaireState } from '$features/course/components/exercise/store';
import type { Question } from '$features/course/types';
import { hasQuestionnaireChanges, mergeExerciseStates } from './exercise-state-merge';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: overrides.id ?? 'question-1',
    title: overrides.title ?? 'Saved question',
    points: overrides.points ?? 1,
    questionTypeId: overrides.questionTypeId ?? 1,
    questionType: overrides.questionType,
    options: overrides.options ?? [],
    settings: overrides.settings,
    ...overrides
  } as Question;
}

function makeState(overrides: Partial<QuestionnaireState> = {}): QuestionnaireState {
  return {
    title: 'Exercise',
    description: 'Saved description',
    dueBy: null,
    questions: [makeQuestion()],
    sections: [],
    sectionDisplayMode: 'one_question',
    totalSubmissions: 0,
    allowMultipleAttempts: false,
    completionPolicy: 'submitted',
    passThreshold: 100,
    slug: '',
    ...overrides
  };
}

describe('mergeExerciseStates', () => {
  it('merges an Assistant description update without removing a local image question', () => {
    const base = makeState();
    const localImageQuestion = makeQuestion({
      id: '2-form',
      title: 'Identify the diagram',
      isDirty: true,
      settings: {
        images: ['https://cdn.example.com/diagram-one.png', 'https://cdn.example.com/diagram-two.png']
      }
    });
    const local = makeState({ questions: [...base.questions, localImageQuestion] });
    const remote = makeState({ description: 'Assistant description' });

    const result = mergeExerciseStates(base, local, remote);

    expect(result.conflictCount).toBe(0);
    expect(result.state.description).toBe('Assistant description');
    expect(result.state.questions).toHaveLength(2);
    expect(result.state.questions[1]).toEqual(localImageQuestion);
  });

  it('preserves the local question when both sides edited it', () => {
    const base = makeState();
    const localQuestion = makeQuestion({ title: 'My unsaved question', isDirty: true });
    const remoteQuestion = makeQuestion({ title: 'Assistant question' });

    const result = mergeExerciseStates(
      base,
      makeState({ questions: [localQuestion] }),
      makeState({ questions: [remoteQuestion] })
    );

    expect(result.conflictCount).toBe(1);
    expect(result.state.questions[0]?.title).toBe('My unsaved question');
  });

  it('merges edits to separate fields of the same question', () => {
    const base = makeState();
    const localQuestion = makeQuestion({ title: 'My unsaved question', isDirty: true });
    const remoteQuestion = makeQuestion({ points: 5 });

    const result = mergeExerciseStates(
      base,
      makeState({ questions: [localQuestion] }),
      makeState({ questions: [remoteQuestion] })
    );

    expect(result.conflictCount).toBe(0);
    expect(result.state.questions[0]?.title).toBe('My unsaved question');
    expect(result.state.questions[0]?.points).toBe(5);
  });

  it('merges edits to separate options of the same question', () => {
    const options = [
      { id: 'option-1', label: 'First', value: 'first' },
      { id: 'option-2', label: 'Second', value: 'second' }
    ];
    const baseQuestion = makeQuestion({ options });
    const base = makeState({ questions: [baseQuestion] });
    const localQuestion = makeQuestion({
      options: [{ ...options[0], label: 'Local first' }, options[1]]
    });
    const remoteQuestion = makeQuestion({
      options: [options[0], { ...options[1], label: 'Assistant second' }]
    });

    const result = mergeExerciseStates(
      base,
      makeState({ questions: [localQuestion] }),
      makeState({ questions: [remoteQuestion] })
    );

    expect(result.conflictCount).toBe(0);
    expect(result.state.questions[0]?.options.map((option) => option.label)).toEqual([
      'Local first',
      'Assistant second'
    ]);
  });

  it('can apply the Assistant side of a conflict without removing local-only questions', () => {
    const base = makeState();
    const localQuestion = makeQuestion({ title: 'My unsaved question', isDirty: true });
    const localOnlyQuestion = makeQuestion({ id: '2-form', title: 'Local image question', isDirty: true });
    const remoteQuestion = makeQuestion({ title: 'Assistant question' });

    const result = mergeExerciseStates(
      base,
      makeState({ questions: [localQuestion, localOnlyQuestion] }),
      makeState({ questions: [remoteQuestion] }),
      'remote'
    );

    expect(result.conflictCount).toBe(1);
    expect(result.state.questions.map((question) => question.title)).toEqual([
      'Assistant question',
      'Local image question'
    ]);
  });

  it('preserves edits made after a conflict notice when applying the Assistant conflict choice', () => {
    const base = makeState();
    const current = makeState({ title: 'My latest title', description: 'Edited after the notice' });
    const remote = makeState({ title: 'Assistant title' });

    const result = mergeExerciseStates(base, current, remote, 'remote');

    expect(result.state.title).toBe('Assistant title');
    expect(result.state.description).toBe('Edited after the notice');
  });

  it('keeps local settings while accepting a remote change to another field', () => {
    const base = makeState();
    const local = makeState({ allowMultipleAttempts: true });
    const remote = makeState({ description: 'Assistant description' });

    const result = mergeExerciseStates(base, local, remote);

    expect(result.state.allowMultipleAttempts).toBe(true);
    expect(result.state.description).toBe('Assistant description');
  });

  it('ignores dirty markers when detecting substantive changes', () => {
    const base = makeState();
    const markedDirty = makeState({
      questions: [{ ...base.questions[0], isDirty: true }]
    });

    expect(hasQuestionnaireChanges(base, markedDirty)).toBe(false);
  });
});
