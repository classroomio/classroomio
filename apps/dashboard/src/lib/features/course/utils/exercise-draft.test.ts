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

function makeState(title: string): QuestionnaireState {
  return {
    title,
    description: '',
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
    saveExerciseDraft('course-1', 'exercise-1', makeState('Unsaved title'));

    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(true);
    expect(get(questionnaire).title).toBe('Unsaved title');

    questionnaire.set(makeState('Server title'));
    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(true);

    clearExerciseDraft('course-1', 'exercise-1');
    expect(restoreExerciseDraft('course-1', 'exercise-1')).toBe(false);
  });
});
