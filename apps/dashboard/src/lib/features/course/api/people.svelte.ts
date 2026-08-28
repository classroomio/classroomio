import type {
  AddPeopleRequest,
  CourseInviteLink,
  CreateCourseInviteLinkRequest,
  CreateStudentInvitePayload,
  CreateStudentInviteRequest,
  DeletePeopleRequest,
  GetCourseInviteLinkRequest,
  GetStudentInviteAuditRequest,
  GetUserCourseAnalyticsRequest,
  ListStudentInvitesRequest,
  ListPeopleRequest,
  ListPeopleQuery,
  ResetMemberCourseProgressRequest,
  RevokeStudentInviteRequest,
  ToggleCourseInviteLinkRequest,
  UpdatePeopleRequest
} from '../utils/types';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import { toPeopleRequestQuery } from '$features/course/utils/people-utils';

import type { TAddCourseMembers } from '@cio/utils/validation/course/people';
import { snackbar } from '$features/ui/snackbar/store';

/**
 * API class for course members operations
 */
export class PeopleApi extends BaseApiWithErrors {
  inviteLink = $state<CourseInviteLink>(null);
  /** Which course `inviteLink` belongs to, so stale responses can be discarded. */
  activeInviteLinkCourseId = $state<string | null>(null);

  /**
   * Lists all course members for a course
   * @param courseId Course ID
   * @returns Array of course members with profile data
   */
  async list(courseId: string, query: ListPeopleQuery) {
    const requestQuery = toPeopleRequestQuery(query);

    return this.execute<ListPeopleRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'].$get({
          param: { courseId },
          query: requestQuery
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
   * Creates a secure student invite link for a course
   * @param courseId Course ID
   * @param payload Invite settings
   * @returns Invite data including inviteLink
   */
  async createStudentInvite(courseId: string, payload: CreateStudentInvitePayload) {
    const result = await this.execute<CreateStudentInviteRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['invites'].$post({
          param: { courseId },
          json: payload
        }),
      logContext: 'creating student invite',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create student invite');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
        } else if ('error' in result) {
          this.errors.general = result.error;
        }
      }
    });

    return result?.data;
  }

  /**
   * Lists secure student invites for a course
   * @param courseId Course ID
   */
  async listStudentInvites(courseId: string) {
    const result = await this.execute<ListStudentInvitesRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['invites'].$get({
          param: { courseId }
        }),
      logContext: 'listing student invites',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to list invites');
        }
      }
    });

    return result?.data;
  }

  /**
   * Revokes a secure student invite
   * @param courseId Course ID
   * @param inviteId Invite ID
   */
  async revokeStudentInvite(courseId: string, inviteId: string) {
    const result = await this.execute<RevokeStudentInviteRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['invites'][':inviteId']['revoke'].$post({
          param: { courseId, inviteId }
        }),
      logContext: 'revoking student invite',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to revoke invite');
        }
      }
    });

    return result?.data;
  }

  /**
   * Loads invite audit events for one invite
   * @param courseId Course ID
   * @param inviteId Invite ID
   */
  async getStudentInviteAudit(courseId: string, inviteId: string) {
    const result = await this.execute<GetStudentInviteAuditRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['invites'][':inviteId']['audit'].$get({
          param: { courseId, inviteId }
        }),
      logContext: 'loading invite audit',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to load invite audit');
        }
      }
    });

    return result?.data;
  }

  /**
   * `peopleApi` is a singleton, so a response for a course the user has already
   * navigated away from must not overwrite the current one.
   */
  private applyInviteLink(courseId: string, invite: CourseInviteLink) {
    if (this.activeInviteLinkCourseId !== courseId) return;

    this.inviteLink = invite;
  }

  /**
   * Points the invite-link state at a course, clearing any link held for a previous
   * one so the tab can never show or copy the wrong course's URL.
   */
  private beginInviteLinkRequest(courseId: string) {
    if (this.activeInviteLinkCourseId !== courseId) {
      this.activeInviteLinkCourseId = courseId;
      this.inviteLink = null;
    }
  }

  /** Loads the course's share link without creating one. Always refetches. */
  async getInviteLink(courseId: string) {
    this.beginInviteLinkRequest(courseId);

    await this.execute<GetCourseInviteLinkRequest>({
      requestFn: () => classroomio.course[':courseId']['invites']['link'].$get({ param: { courseId } }),
      logContext: 'loading course invite link',
      onSuccess: (result) => this.applyInviteLink(courseId, result.data),
      onError: () => snackbar.error('invite_link.load_failed')
    });
  }

  /** Returns the course's share link, creating it on first call. */
  async generateInviteLink(courseId: string) {
    this.beginInviteLinkRequest(courseId);

    await this.execute<CreateCourseInviteLinkRequest>({
      requestFn: () => classroomio.course[':courseId']['invites']['link'].$post({ param: { courseId } }),
      logContext: 'creating course invite link',
      onSuccess: (result) => this.applyInviteLink(courseId, result.data),
      onError: () => snackbar.error('invite_link.generate_failed')
    });
  }

  /** Disables or re-enables the course's share link. */
  async toggleInviteLink(courseId: string, isRevoked: boolean) {
    await this.execute<ToggleCourseInviteLinkRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['invites']['link'].$patch({ param: { courseId }, json: { isRevoked } }),
      logContext: 'updating course invite link',
      onSuccess: (result) => {
        this.applyInviteLink(courseId, result.data);
        snackbar.success(isRevoked ? 'invite_link.snackbar.disabled' : 'invite_link.snackbar.enabled');
      },
      onError: () => snackbar.error('invite_link.toggle_failed')
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

  /**
   * Resets all learner progress for a course member while keeping them enrolled.
   */
  async resetCourseProgress(courseId: string, memberId: string) {
    await this.execute<ResetMemberCourseProgressRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['members'][':memberId']['reset-progress'].$post({
          param: { courseId, memberId }
        }),
      logContext: 'resetting course member progress',
      onSuccess: () => {
        snackbar.success('snackbar.course.people.progress_reset');
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.course.people.progress_reset_failed');
        }
      }
    });
  }
}

export const peopleApi = /* @__PURE__ */ new PeopleApi();
