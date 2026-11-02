import { SQLiteStorage } from 'expo-sqlite/kv-store';

import type { ExerciseDraft } from '@/feature/exercise/types/exercise';

const storage = new SQLiteStorage('exercise-drafts.db');

function draftKey(userId: string, exerciseId: string) {
  return `${userId}:${exerciseId}`;
}

function isDraft(value: unknown): value is ExerciseDraft {
  if (!value || typeof value !== 'object') return false;

  const draft = value as Partial<ExerciseDraft>;

  return typeof draft.answers === 'object' && draft.answers !== null && typeof draft.currentIndex === 'number';
}

export function readExerciseDraft(userId: string, exerciseId: string): ExerciseDraft | null {
  try {
    const raw = storage.getItemSync(draftKey(userId, exerciseId));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    return isDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeExerciseDraft(userId: string, exerciseId: string, draft: ExerciseDraft) {
  return storage.setItemAsync(draftKey(userId, exerciseId), JSON.stringify(draft));
}

export function clearExerciseDraft(userId: string, exerciseId: string) {
  return storage.removeItemAsync(draftKey(userId, exerciseId));
}
