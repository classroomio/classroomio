import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ErrorCodes } from '@cio/utils/constants';
import type { GetPathJourneyRequest, PathJourney } from '../utils/types';
import type { EnrollInLearningPathRequest } from '$features/learning-path/utils/types';

/**
 * Learner-side path journey API for the `/paths/[publicId]` learner hub.
 * The route layout calls `fetchJourney`, which reads the enrolled learner's
 * ordered courses, progress and lock state; `enroll` self-enrolls in a
 * published, free, self-enrollable path. Outcome flags back the shared access
 * check: `isForbidden` for non-members, `isNotFound` for missing paths.
 */
class PathJourneyApi extends BaseApiWithErrors {
  journey = $state<PathJourney | null>(null);
  isNotFound = $state(false);
  isForbidden = $state(false);
  loadError = $state<string | null>(null);
  private journeyRequestSeq = 0;

  /**
   * Fetches the caller's journey for a path. Only the newest request writes
   * state; stale responses are discarded. Resets the outcome flags on each
   * call so the layout renders loading until this fetch settles.
   */
  async fetchJourney(publicId: string): Promise<PathJourney | null> {
    if (!publicId) return null;

    const seq = ++this.journeyRequestSeq;
    this.isNotFound = false;
    this.isForbidden = false;
    this.loadError = null;
    let fetched: PathJourney | null = null;

    await this.execute<GetPathJourneyRequest>({
      requestFn: () => classroomio['learning-path'][':pathId']['journey'].$get({ param: { pathId: publicId } }),
      logContext: 'fetching path journey',
      onSuccess: (response) => {
        if (seq !== this.journeyRequestSeq) return;
        fetched = response.data;
        this.journey = response.data;
        this.isNotFound = false;
        this.isForbidden = false;
        this.loadError = null;
      },
      onError: (err) => {
        if (seq !== this.journeyRequestSeq) return;
        this.journey = null;
        this.isNotFound = false;
        this.isForbidden = false;
        this.loadError = null;

        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : null;
        if (
          code === ErrorCodes.UNAUTHORIZED ||
          code === ErrorCodes.FORBIDDEN ||
          code === ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND
        ) {
          this.isForbidden = true;
          return;
        }

        if (code === ErrorCodes.LEARNING_PATH_NOT_FOUND) {
          this.isNotFound = true;
          return;
        }

        this.loadError =
          typeof err === 'string'
            ? err
            : err && typeof err === 'object' && 'error' in err
              ? String((err as { error: unknown }).error)
              : 'Failed to load learning path';
      }
    });

    return fetched;
  }

  /**
   * Self-enrolls the caller in a path. Idempotent; the backend enforces
   * published, free and self-enrollment rules.
   */
  async enroll(publicId: string) {
    if (!publicId) return null;

    return this.execute<EnrollInLearningPathRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['enroll'].$post({ param: { pathId: publicId }, json: {} }),
      logContext: 'enrolling in learning path'
    });
  }
}

export const pathJourneyApi = new PathJourneyApi();
