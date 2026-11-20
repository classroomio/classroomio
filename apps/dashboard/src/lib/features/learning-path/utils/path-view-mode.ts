import type { PathAccessInput, PathAccessState, PathViewMode } from './types';

/**
 * Resolves which UI the `/paths/[publicId]` route should render from the org role,
 * the same rule as `isCourseLearnerView`: org-site visitors and org students get
 * the learner hub; everyone else gets the staff workspace. Access itself is
 * decided by the endpoint each mode calls.
 * @param isLearnerView Value of `$isPathLearnerView` (alias of `isCourseLearnerView`).
 * @param isOrgStudent Value of `$isOrgStudent` (`null` while the org role resolves).
 * @param isStudentExperience Value of `$isStudentExperience`.
 */
export function resolvePathViewMode(
  isLearnerView: boolean,
  isOrgStudent: boolean | null,
  isStudentExperience: boolean
): PathViewMode {
  if (!isStudentExperience && isOrgStudent === null) return 'loading';

  return isLearnerView ? 'learner' : 'staff';
}

/**
 * Maps the active mode's fetch result to one render state.
 * `not_found` and `forbidden` come from that request's error, `error` is any
 * other failure, `ready` needs the matching record, otherwise still loading.
 */
export function resolvePathAccessState(input: PathAccessInput): PathAccessState {
  if (input.isNotFound) return 'not_found';
  if (input.isForbidden) return 'forbidden';
  if (input.loadError) return 'error';
  if (input.isLoaded) return 'ready';

  return 'loading';
}
