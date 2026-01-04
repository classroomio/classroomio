import type {
  AddPeopleRequest,
  DeletePeopleRequest,
  GetUserCourseAnalyticsRequest,
  ListPeopleRequest,
  UpdatePeopleRequest
} from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import type { TAddCourseMembers } from '@cio/utils/validation/course/people';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for course members operations
 */
export class PeopleApi extends BaseApiWithErrors {
  /**
   * Lists all course members for a course
   * @param courseId Course ID
   * @returns Array of course members with profile data
   */
  async list(courseId: string) {
    return this.execute<ListPeopleRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'].$get({
          param: { courseId }
        }),
      logContext: 'listing course members',
      onSuccess: (response) => {
        if (response.data) {
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to list course members');
        }
      }
    });
  }

  /**
   * Adds course members to a course
   * @param courseId Course ID
   * @param members Array of members to add
   * @returns Array of created members or null on error
   */
  async add(courseId: string, members: TAddCourseMembers) {
    await this.execute<AddPeopleRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'].$post({
          param: { courseId },
          json: members
        }),
      logContext: 'adding course members',
      onSuccess: (response) => {
        if (response.data) {
          const count = Array.isArray(response.data) ? response.data.length : 1;
          snackbar.success(`${count} member${count > 1 ? 's' : ''} added successfully`);
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to add course members');
        }
      }
    });
  }

  /**
   * Updates a course member
   * @param courseId Course ID
   * @param memberId Member ID
   * @param data Partial member data to update
   * @returns The updated member data or null on error
   */
  async update(courseId: string, memberId: string, data: Partial<{ roleId: number; email: string }>) {
    await this.execute<UpdatePeopleRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'][':memberId'].$put({
          param: { courseId, memberId },
          json: data
        }),
      logContext: 'updating course member',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Member updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update course member');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Deletes a course member
   * @param courseId Course ID
   * @param memberId Member ID
   * @returns The deleted member data or null on error
   */
  async delete(courseId: string, memberId: string) {
    await this.execute<DeletePeopleRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'][':memberId'].$delete({
          param: { courseId, memberId }
        }),
      logContext: 'deleting course member',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Member removed successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete course member');
        }
      }
    });
  }

  /**
   * Gets user course analytics for a specific course
   * @param courseId Course ID
   * @param userId User ID (profile ID)
   * @returns User course analytics data or null on error
   */
  async getUserCourseAnalytics(courseId: string, userId: string) {
    return this.execute<GetUserCourseAnalyticsRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'][':userId']['analytics'].$get({
          param: { courseId, userId }
        }),
      logContext: 'fetching user course analytics',
      onSuccess: (response) => {
        if (response.data) {
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch user course analytics');
        }
      }
    });
  }
}

export const peopleApi = new PeopleApi();
