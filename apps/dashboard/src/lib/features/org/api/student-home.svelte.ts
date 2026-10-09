import type { GetStudentHomeCoursesRequest, StudentHomeCourseOption } from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

class StudentHomeApi extends BaseApiWithErrors {
  courses = $state<StudentHomeCourseOption[] | null>(null);
  loading = $state(false);

  async listCourses(options: { search?: string; includeCourseId?: string } = {}) {
    this.loading = true;

    try {
      await this.execute<GetStudentHomeCoursesRequest>({
        requestFn: () =>
          classroomio.organization['student-home'].courses.$get({
            query: {
              ...(options.search ? { search: options.search } : {}),
              ...(options.includeCourseId ? { includeCourseId: options.includeCourseId } : {})
            }
          }),
        logContext: 'listing student home courses',
        onSuccess: (response) => {
          this.courses = response.data;
        }
      });
    } finally {
      this.loading = false;
    }
  }

  reset() {
    super.reset();
    this.courses = null;
    this.loading = false;
  }
}

export const studentHomeApi = new StudentHomeApi();
