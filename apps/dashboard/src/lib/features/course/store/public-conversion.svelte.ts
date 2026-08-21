import { SvelteSet } from 'svelte/reactivity';
import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';
import type { Course, ExerciseConversionGroup, PublicConversionCountdown } from '../utils/types';
import {
  calculateConversionCountdown,
  getNextUnresolvedExercise,
  groupOffendersByExercise
} from '../utils/public-conversion-utils';

interface PublicConversionPersistedState {
  isActive: boolean;
  courseId: string | null;
  offenders: NonAutoGradableQuestionOffender[];
  resolvedExerciseIds: string[];
}

const STORAGE_PREFIX = 'classroomio_public_conversion_';

class PublicConversionStore {
  isActive = $state(false);
  courseId = $state<string | null>(null);
  offenders = $state<NonAutoGradableQuestionOffender[]>([]);
  resolvedExerciseIds = new SvelteSet<string>();
  isConverting = $state(false);

  constructor() {
    if (typeof window !== 'undefined') {
      this.restoreActiveSession();
    }
  }

  private getStorageKey(id: string) {
    return `${STORAGE_PREFIX}${id}`;
  }

  private restoreActiveSession() {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = sessionStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as PublicConversionPersistedState;
          if (parsed.isActive && parsed.courseId) {
            this.isActive = true;
            this.courseId = parsed.courseId;
            this.offenders = parsed.offenders ?? [];
            this.resolvedExerciseIds.clear();
            (parsed.resolvedExerciseIds ?? []).forEach((id) => this.resolvedExerciseIds.add(id));
            break;
          }
        }
      }
    } catch {
      // Ignore sessionStorage exceptions
    }
  }

  private persist() {
    if (typeof window === 'undefined' || !this.courseId) return;
    try {
      if (!this.isActive) {
        sessionStorage.removeItem(this.getStorageKey(this.courseId));
        return;
      }
      const data: PublicConversionPersistedState = {
        isActive: this.isActive,
        courseId: this.courseId,
        offenders: this.offenders,
        resolvedExerciseIds: Array.from(this.resolvedExerciseIds)
      };
      sessionStorage.setItem(this.getStorageKey(this.courseId), JSON.stringify(data));
    } catch {
      // Ignore sessionStorage exceptions
    }
  }

  start(courseId: string, offenders: NonAutoGradableQuestionOffender[]) {
    this.courseId = courseId;
    this.offenders = offenders;
    this.isActive = true;
    this.resolvedExerciseIds.clear();
    this.persist();
  }

  updateOffenders(courseId: string, offenders: NonAutoGradableQuestionOffender[]) {
    this.courseId = courseId;
    this.offenders = offenders;
    this.isActive = offenders.length > 0;
    this.persist();
  }

  markExerciseResolved(exerciseId: string) {
    this.resolvedExerciseIds.add(exerciseId);
    this.persist();
  }

  unmarkExerciseResolved(exerciseId: string) {
    this.resolvedExerciseIds.delete(exerciseId);
    this.persist();
  }

  getGroups(course?: Course | null): ExerciseConversionGroup[] {
    return groupOffendersByExercise(this.offenders, course);
  }

  getCountdown(
    course?: Course | null,
    currentExerciseId?: string | null,
    currentExerciseQuestions?: Array<{
      id?: string | number;
      questionTypeId?: number | null;
      deletedAt?: string | null;
    }> | null
  ): PublicConversionCountdown {
    const groups = this.getGroups(course);
    return calculateConversionCountdown({
      groups,
      resolvedExerciseIds: this.resolvedExerciseIds,
      currentExerciseId,
      currentExerciseQuestions
    });
  }

  getNextExercise(course?: Course | null, currentExerciseId?: string | null): ExerciseConversionGroup | null {
    const groups = this.getGroups(course);
    return getNextUnresolvedExercise(groups, this.resolvedExerciseIds, currentExerciseId);
  }

  cancel() {
    if (this.courseId && typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(this.getStorageKey(this.courseId));
      } catch {
        // Ignore
      }
    }
    this.isActive = false;
    this.courseId = null;
    this.offenders = [];
    this.resolvedExerciseIds.clear();
    this.isConverting = false;
  }

  reset() {
    this.cancel();
  }
}

export const publicConversionFlow = new PublicConversionStore();
