import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  GetOrgCoursesRequest,
  GetRecommendedCoursesRequest,
  GetUserEnrolledCoursesRequest,
  OrgCourses,
  RecommendedCourses,
  UserEnrolledCourses
} from '$features/course/types';

/**
 * API class for course operations
 */
export class CoursesApi extends BaseApiWithErrors {
  orgCourses = $state<OrgCourses>([]);
  enrolledCourses = $state<UserEnrolledCourses>([]);
  recommendedCourses = $state<RecommendedCourses>([]);

  /**
   * Fetches org courses for the current organization
   * Org ID is automatically added from currentOrg store
   */
  async getOrgCourses() {
    return this.execute<GetOrgCoursesRequest>({
      requestFn: () => classroomio.organization.courses.$get({}),
      logContext: 'fetching org courses',
      onSuccess: (response) => {
        if (response.data) {
          this.orgCourses = response.data;
        }
      }
    });
  }

  /**
   * Fetches user enrolled courses for the current organization
   * Org ID is automatically added from currentOrg store
   */
  async getEnrolledCourses() {
    return this.execute<GetUserEnrolledCoursesRequest>({
      requestFn: () => classroomio.organization.courses.enrolled.$get({}),
      logContext: 'fetching enrolled courses',
      onSuccess: (response) => {
        if (response.data) {
          this.enrolledCourses = response.data;
        }
      }
    });
  }

  /**
   * Fetches recommended courses (published courses user isn't enrolled in) for the current organization
   * Org ID is automatically added from currentOrg store
   */
  async getRecommendedCourses() {
    await this.execute<GetRecommendedCoursesRequest>({
      requestFn: () => classroomio.organization.courses.recommended.$get({}),
      logContext: 'fetching recommended courses',
      onSuccess: (response) => {
        if (response.data) {
          this.recommendedCourses = response.data;
        }
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          console.error('Failed to fetch recommended courses:', result);
          return;
        }
        if ('error' in result) {
          console.error('Failed to fetch recommended courses:', result.error);
        }
      }
    });
  }
}

export const coursesApi = new CoursesApi();
