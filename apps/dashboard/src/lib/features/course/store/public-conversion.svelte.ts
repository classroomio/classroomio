import { SvelteSet } from 'svelte/reactivity';
import type { NonAutoGradableQuestionOffender } from '@cio/utils/validation/course';
import type {
  Course,
  ExerciseConversionGroup,
  PublicConversionCountdown,
  PublicConversionPersistedState
} from '../utils/types';
import {
  calculateConversionCountdown,
  getNextUnresolvedExercise,
  groupOffendersByExercise,
  type QuestionLike
} from '../utils/public-conversion-utils';

const STORAGE_PREFIX = 'classroomio_public_conversion_';

class PublicConversionStore {
  isActive = $state(false);
  courseId = $state<string | null>(null);
  initialOffenders = $state<NonAutoGradableQuestionOffender[]>([]);
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

  restoreForCourse(courseId: string) {
    if (typeof window === 'undefined' || !courseId) return;
    if (this.isActive && this.courseId === courseId) return;

    try {
      const raw = sessionStorage.getItem(this.getStorageKey(courseId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as PublicConversionPersistedState;
      if (parsed.isActive && parsed.courseId === courseId) {
        this.isActive = true;
        this.courseId = parsed.courseId;
        this.initialOffenders = parsed.initialOffenders ?? parsed.offenders ?? [];
        this.offenders = parsed.offenders ?? [];
        this.resolvedExerciseIds.clear();
        (parsed.resolvedExerciseIds ?? []).forEach((id) => this.resolvedExerciseIds.add(id));
      }
    } catch {
      // Ignore sessionStorage exceptions
    }
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
            this.initialOffenders = parsed.initialOffenders ?? parsed.offenders ?? [];
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
        initialOffenders: this.initialOffenders,
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
    this.initialOffenders = [...offenders];
    this.offenders = [...offenders];
    this.isActive = true;
    this.resolvedExerciseIds.clear();
    this.persist();
  }

  updateOffenders(courseId: string, offenders: NonAutoGradableQuestionOffender[]) {
    this.courseId = courseId;
    this.initialOffenders = [...offenders];
    this.offenders = [...offenders];
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

  syncExerciseQuestions(
    exerciseId: string,
    manualQuestions: Array<{
      id?: string | number;
      title?: string;
      questionTypeId?: number | null;
      questionType?: { id: number } | null;
    }>,
    exerciseTitle?: string
  ) {
    const otherOffenders = this.offenders.filter((o) => o.exerciseId !== exerciseId);

    const newOffenders: NonAutoGradableQuestionOffender[] = manualQuestions.map((q, index) => {
      const typeId = Number(q.questionTypeId ?? q.questionType?.id ?? 1);
      return {
        exerciseId,
        exerciseTitle: exerciseTitle || 'Untitled Exercise',
        questionId: q.id ?? `${exerciseId}-${index}`,
        questionTitle: q.title || `Question ${index + 1}`,
        typeId
      };
    });

    this.offenders = [...otherOffenders, ...newOffenders];

    if (newOffenders.length === 0) {
      this.resolvedExerciseIds.add(exerciseId);
    } else {
      this.resolvedExerciseIds.delete(exerciseId);
    }

    this.persist();
  }

  getGroups(course?: Course | null): ExerciseConversionGroup[] {
    return groupOffendersByExercise(this.initialOffenders, course);
  }

  getCountdown(
    course?: Course | null,
    currentExerciseId?: string | null,
    currentExerciseQuestions?: QuestionLike[] | null
  ): PublicConversionCountdown {
    const groups = this.getGroups(course);
    return calculateConversionCountdown({
      groups,
      offenders: this.offenders,
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
    this.initialOffenders = [];
    this.offenders = [];
    this.resolvedExerciseIds.clear();
    this.isConverting = false;
  }

  reset() {
    this.cancel();
  }
}

export const publicConversionFlow = new PublicConversionStore();
