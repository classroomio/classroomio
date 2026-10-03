import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

import { questionnaire, type QuestionnaireState } from '$features/course/components/exercise/store';
import { clearExerciseDraft, restoreExerciseDraft, saveExerciseDraft } from './exercise-draft';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

function makeState(title: string, description = ''): QuestionnaireState {
  return {
    title,
    description,
    dueBy: null,
    questions: [],
    sections: [],
    sectionDisplayMode: 'one_question',
    totalSubmissions: 0
  };
}

describe('exercise drafts', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    questionnaire.set(makeState('Server title'));
  });

  it('restores a draft and retains it until an explicit successful save clears it', () => {
    const baseState = makeState('Server title');
    saveExerciseDraft('course-1', 'exercise-1', makeState('Unsaved title'), baseState);

    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(true);
    expect(get(questionnaire).title).toBe('Unsaved title');

    questionnaire.set(makeState('Server title'));
    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(true);

    clearExerciseDraft('course-1', 'exercise-1');
    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(false);
  });

  it('keeps newer server changes when they conflict with a stored draft', () => {
    const baseState = makeState('Original title');
    saveExerciseDraft('course-1', 'exercise-1', makeState('Draft title'), baseState);
    questionnaire.set(makeState('Assistant title'));

    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(true);
    expect(get(questionnaire).title).toBe('Assistant title');
  });

  it('restores non-conflicting draft edits alongside newer server changes', () => {
    const baseState = makeState('Original title', 'Original description');
    const draftState = makeState('Draft title', 'Original description');
    saveExerciseDraft('course-1', 'exercise-1', draftState, baseState);
    questionnaire.set(makeState('Original title', 'Assistant description'));

    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(true);
    expect(get(questionnaire).title).toBe('Draft title');
    expect(get(questionnaire).description).toBe('Assistant description');
  });
});
