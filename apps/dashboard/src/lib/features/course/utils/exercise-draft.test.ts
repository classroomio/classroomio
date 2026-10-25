import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

import { questionnaire, type QuestionnaireState } from '$features/course/components/exercise/store';
import { applyExerciseDraft, clearExerciseDraft, peekExerciseDraft, saveExerciseDraft } from './exercise-draft';

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

  it('scopes drafts per profile, so one account never sees another account’s draft', () => {
    const baseState = makeState('Server title');
    saveExerciseDraft('course-1', 'exercise-1', 'profile-a', makeState('Unsaved title'), baseState);

    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-b')).toBeNull();
    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();
  });

  it('peeking a draft never touches the live editor; only applying it does', () => {
    const baseState = makeState('Server title');
    saveExerciseDraft('course-1', 'exercise-1', 'profile-a', makeState('Unsaved title'), baseState);

    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();
    expect(get(questionnaire).title).toBe('Server title');

    expect(applyExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();
    expect(get(questionnaire).title).toBe('Unsaved title');
  });

  it('retains an applied draft until an explicit successful save clears it', () => {
    const baseState = makeState('Server title');
    saveExerciseDraft('course-1', 'exercise-1', 'profile-a', makeState('Unsaved title'), baseState);

    expect(applyExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();
    expect(get(questionnaire).title).toBe('Unsaved title');

    questionnaire.set(makeState('Server title'));
    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();

    clearExerciseDraft('course-1', 'exercise-1', 'profile-a');
    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-a')).toBeNull();
  });

  it('discarding a peeked draft removes it for good, without ever applying it', () => {
    const baseState = makeState('Server title');
    saveExerciseDraft('course-1', 'exercise-1', 'profile-a', makeState('Unsaved title'), baseState);

    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();
    clearExerciseDraft('course-1', 'exercise-1', 'profile-a');

    expect(peekExerciseDraft('course-1', 'exercise-1', 'profile-a')).toBeNull();
    expect(applyExerciseDraft('course-1', 'exercise-1', 'profile-a')).toBeNull();
    expect(get(questionnaire).title).toBe('Server title');
  });

  it('restores the draft side of conflicts and offers the server version as a choice', () => {
    const baseState = makeState('Original title');
    saveExerciseDraft('course-1', 'exercise-1', 'profile-a', makeState('Draft title'), baseState);
    questionnaire.set(makeState('Assistant title'));

    const restoredDraft = applyExerciseDraft('course-1', 'exercise-1', 'profile-a');

    expect(restoredDraft).toMatchObject({
      conflictCount: 1,
      remoteState: { title: 'Assistant title' }
    });
    expect(get(questionnaire).title).toBe('Draft title');
  });

  it('restores non-conflicting draft edits alongside newer server changes', () => {
    const baseState = makeState('Original title', 'Original description');
    const draftState = makeState('Draft title', 'Original description');
    saveExerciseDraft('course-1', 'exercise-1', 'profile-a', draftState, baseState);
    questionnaire.set(makeState('Original title', 'Assistant description'));

    expect(applyExerciseDraft('course-1', 'exercise-1', 'profile-a')).not.toBeNull();
    expect(get(questionnaire).title).toBe('Draft title');
    expect(get(questionnaire).description).toBe('Assistant description');
  });
});
