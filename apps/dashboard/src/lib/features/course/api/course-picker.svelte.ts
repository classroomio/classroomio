import { BaseApi, classroomio } from '$lib/utils/services/api';
import type {
  AddableCoursesQuery,
  AddableCoursesSuccess,
  CoursePickerSource,
  GetCohortAddableCoursesRequest,
  GetPathAddableCoursesRequest
} from '$features/course/utils/types';

/**
 * Loads pages for the add-courses picker. The server pages, searches and
 * leaves out courses the target cannot add, so nothing is filtered here.
 * Create one per picker: its loading state must not be shared with the
 * cohort or path API whose `isLoading` drives the Add button.
 */
export class CoursePickerApi extends BaseApi {
  async listAddableCourses(
    source: CoursePickerSource,
    query: AddableCoursesQuery,
    signal?: AbortSignal
  ): Promise<AddableCoursesSuccess | undefined> {
    const requestQuery = {
      page: String(query.page),
      limit: String(query.limit),
      search: query.search || undefined
    };
    const init = { init: { signal } };

    if (source.kind === 'cohort') {
      return this.execute<GetCohortAddableCoursesRequest>({
        requestFn: () =>
          classroomio.cohort[':cohortId']['available-courses'].$get(
            { param: { cohortId: source.cohortId }, query: requestQuery },
            init
          ),
        logContext: 'listing addable cohort courses'
      });
    }

    return this.execute<GetPathAddableCoursesRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['available-courses'].$get(
          { param: { pathId: source.pathId }, query: requestQuery },
          init
        ),
      logContext: 'listing addable learning path courses'
    });
  }
}
