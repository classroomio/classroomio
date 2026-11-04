import type {
  GetStudentHomeCoursesRequest,
  StudentHomeCourseOption,
  StudentHomeCoursesPagination
} from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

class StudentHomeApi extends BaseApiWithErrors {
  courses = $state<StudentHomeCourseOption[] | null>(null);
  pagination = $state<StudentHomeCoursesPagination | null>(null);
  loading = $state(false);
  loadingMore = $state(false);
  #requestId = 0;

  get hasMore(): boolean {
    return !!this.pagination && this.pagination.page < this.pagination.totalPages;
  }

  async listCourses(options: { search?: string; includeCourseId?: string; page?: number } = {}) {
    const page = options.page ?? 1;
    const isFirstPage = page === 1;
    const requestId = ++this.#requestId;

    if (isFirstPage) {
      this.loading = true;
    } else {
      this.loadingMore = true;
    }

    try {
      await this.execute<GetStudentHomeCoursesRequest>({
        requestFn: () =>
          classroomio.organization['student-home'].courses.$get({
            query: {
              page: String(page),
              ...(options.search ? { search: options.search } : {}),
              ...(options.includeCourseId ? { includeCourseId: options.includeCourseId } : {})
            }
          }),
        logContext: 'listing student home courses',
        onSuccess: (response) => {
          if (requestId !== this.#requestId) return;

          this.courses = isFirstPage ? response.data : [...(this.courses ?? []), ...response.data];
          this.pagination = response.pagination;
        }
      });
    } finally {
      if (requestId === this.#requestId) {
        this.loading = false;
        this.loadingMore = false;
      }
    }
  }

  reset() {
    super.reset();
    this.#requestId += 1;
    this.courses = null;
    this.pagination = null;
    this.loading = false;
    this.loadingMore = false;
  }
}

export const studentHomeApi = new StudentHomeApi();
