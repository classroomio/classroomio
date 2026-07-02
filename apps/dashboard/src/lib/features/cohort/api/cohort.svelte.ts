import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { Cohort, CohortDetail, CohortMember, CohortCourse, CohortNewsfeed } from '../utils/types';
import type {
  TCreateCohort,
  TUpdateCohort,
  TAddCohortMembers,
  TUpdateCohortMember,
  TAddCourseToCohort,
  TInviteStudentsToCohort,
  TAssignExistingStudentsToCohort
} from '@cio/utils/validation/cohort';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import { isStudentExperience } from '$lib/utils/store/app';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

class CohortApi extends BaseApiWithErrors {
  cohorts = $state<Cohort[]>([]);
  cohort = $state<CohortDetail | null>(null);
  members = $state<CohortMember[]>([]);
  courses = $state<CohortCourse[]>([]);
  newsfeed = $state<CohortNewsfeed | null>(null);
  isCohortShellLoading = $state(false);
  currentCohortId = $state<string | null>(null);

  loadedCohortId = $state<string | null>(null);
  loadedMembersCohortId = $state<string | null>(null);
  loadedCoursesCohortId = $state<string | null>(null);
  loadedCoursesStudentExperience = $state<boolean | null>(null);
  loadedNewsfeedCohortId = $state<string | null>(null);

  syncCohortCourseCount(cohortId: string, courseCount: number) {
    this.cohorts = this.cohorts.map((item) => (item.id === cohortId ? { ...item, courseCount } : item));
  }

  async listCohorts() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<typeof classroomio.cohort.$get>({
      requestFn: () => classroomio.cohort.$get({ query: { organizationId: org.id } }),
      onSuccess: (data) => {
        this.cohorts = data.data;
      },
      logContext: 'listCohorts'
    });
  }

  async getCohort(cohortId: string, force = false) {
    if (!force && this.loadedCohortId === cohortId) return;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['$get']>({
      requestFn: () => classroomio.cohort[':cohortId'].$get({ param: { cohortId } }),
      onSuccess: (data) => {
        this.cohort = data.data;
        this.loadedCohortId = cohortId;
      },
      logContext: 'getCohort'
    });
  }

  resetCohortShell(cohortId?: string) {
    this.currentCohortId = cohortId ?? null;
    this.cohort = null;
    this.members = [];
    this.courses = [];
    this.newsfeed = null;
    this.loadedCohortId = null;
    this.loadedMembersCohortId = null;
    this.loadedCoursesCohortId = null;
    this.loadedCoursesStudentExperience = null;
    this.loadedNewsfeedCohortId = null;
  }

  async ensureCohortShell(cohortId: string, force = false) {
    const studentExperience = get(isStudentExperience);
    const isShellReady =
      this.loadedCohortId === cohortId &&
      this.loadedMembersCohortId === cohortId &&
      this.loadedCoursesCohortId === cohortId &&
      this.loadedCoursesStudentExperience === studentExperience;

    if (!force && isShellReady) {
      return;
    }

    const isCohortChanged = this.currentCohortId !== cohortId;
    if (force || isCohortChanged) {
      this.resetCohortShell(cohortId);
    }

    this.currentCohortId = cohortId;
    this.isCohortShellLoading = true;

    try {
      await Promise.all([
        this.getCohort(cohortId, force),
        this.listMembers(cohortId, force),
        this.listCourses(cohortId, force)
      ]);
    } finally {
      this.isCohortShellLoading = false;
    }
  }

  async createCohort(data: TCreateCohort) {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<typeof classroomio.cohort.$post>({
      requestFn: () =>
        classroomio.cohort.$post({
          json: { ...data, organizationId: org.id }
        }),
      onSuccess: (res) => {
        this.cohorts = [res.data, ...this.cohorts];
        snackbar.success(t.get('cohorts.create_success'));
      },
      logContext: 'createCohort'
    });
  }

  async updateCohort(cohortId: string, data: TUpdateCohort) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['$put']>({
      requestFn: () => classroomio.cohort[':cohortId'].$put({ param: { cohortId }, json: data }),
      onSuccess: (res) => {
        this.cohort = res.data;
        this.cohorts = this.cohorts.map((p) => (p.id === cohortId ? { ...p, ...res.data } : p));
        snackbar.success(t.get('cohorts.update_success'));
      },
      onError: (result) => {
        const message = typeof result === 'string' ? result : result.error;
        snackbar.error(message || 'Failed to update cohort');
      },
      logContext: 'updateCohort'
    });
  }

  async deleteCohort(cohortId: string) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['$delete']>({
      requestFn: () => classroomio.cohort[':cohortId'].$delete({ param: { cohortId } }),
      onSuccess: () => {
        this.cohorts = this.cohorts.filter((p) => p.id !== cohortId);
        snackbar.success(t.get('cohorts.delete_success'));
      },
      logContext: 'deleteCohort'
    });
  }

  // Members

  async listMembers(cohortId: string, force = false) {
    if (!force && this.loadedMembersCohortId === cohortId) return;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['members']['$get']>({
      requestFn: () => classroomio.cohort[':cohortId'].members.$get({ param: { cohortId } }),
      onSuccess: (data) => {
        this.members = data.data;
        this.loadedMembersCohortId = cohortId;
      },
      logContext: 'listCohortMembers'
    });
  }

  async addMembers(cohortId: string, data: TAddCohortMembers) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['members']['$post']>({
      requestFn: () => classroomio.cohort[':cohortId'].members.$post({ param: { cohortId }, json: data }),
      onSuccess: async () => {
        await this.listMembers(cohortId, true);
        snackbar.success(t.get('cohorts.members_added') || 'Members added');
      },
      logContext: 'addCohortMembers'
    });
  }

  async updateMember(cohortId: string, memberId: string, data: TUpdateCohortMember) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['members'][':memberId']['$put']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].members[':memberId'].$put({
          param: { cohortId, memberId },
          json: data
        }),
      onSuccess: (res) => {
        this.members = this.members.map((m) => (m.id === memberId ? { ...m, ...res.data } : m));
      },
      logContext: 'updateCohortMember'
    });
  }

  async removeMember(cohortId: string, memberId: string) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['members'][':memberId']['$delete']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].members[':memberId'].$delete({
          param: { cohortId, memberId }
        }),
      onSuccess: () => {
        this.members = this.members.filter((m) => m.id !== memberId);
        snackbar.success(t.get('cohorts.member_removed') || 'Member removed');
      },
      logContext: 'removeCohortMember'
    });
  }

  // Courses

  async listCourses(cohortId: string, force = false) {
    const studentExperience = get(isStudentExperience);

    if (
      !force &&
      this.loadedCoursesCohortId === cohortId &&
      this.loadedCoursesStudentExperience === studentExperience
    ) {
      return;
    }

    await this.execute<(typeof classroomio.cohort)[':cohortId']['courses']['$get']>({
      requestFn: () => classroomio.cohort[':cohortId'].courses.$get({ param: { cohortId } }),
      onSuccess: (data) => {
        this.courses = data.data;
        this.syncCohortCourseCount(cohortId, data.data.length);
        this.loadedCoursesCohortId = cohortId;
        this.loadedCoursesStudentExperience = studentExperience;
      },
      logContext: 'listCohortCourses'
    });
  }

  async addCourse(cohortId: string, data: TAddCourseToCohort) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['courses']['$post']>({
      requestFn: () => classroomio.cohort[':cohortId'].courses.$post({ param: { cohortId }, json: data }),
      onSuccess: async () => {
        await this.listCourses(cohortId, true);
        this.syncCohortCourseCount(cohortId, this.courses.length);
        snackbar.success(t.get('cohorts.course_added') || 'Course added');
      },
      logContext: 'addCourseToCohort'
    });
  }

  async addCourses(cohortId: string, courseIds: string[]) {
    if (courseIds.length === 0) {
      return false;
    }

    this.isLoading = true;
    this.error = null;
    this.success = false;

    try {
      for (const courseId of courseIds) {
        const response = await classroomio.cohort[':cohortId'].courses.$post({
          param: { cohortId },
          json: { courseId }
        });
        const result = (await response.json()) as { success?: boolean; error?: string };

        if (!result.success) {
          this.error = result.error ?? 'Failed to add course to cohort';
          return false;
        }
      }

      await this.listCourses(cohortId, true);
      this.syncCohortCourseCount(cohortId, this.courses.length);

      const successMessage =
        courseIds.length === 1
          ? t.get('cohorts.course_added') || 'Course added'
          : t.get('cohorts.multiple_added') || 'Courses added';

      snackbar.success(successMessage);
      this.success = true;
      return true;
    } catch (error) {
      console.error('Error in addCoursesToCohort:', error);
      this.error = error instanceof Error ? error.message : 'Failed to add courses to cohort';
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async removeCourse(cohortId: string, courseId: string) {
    await this.execute<(typeof classroomio.cohort)[':cohortId']['courses'][':courseId']['$delete']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].courses[':courseId'].$delete({
          param: { cohortId, courseId }
        }),
      onSuccess: () => {
        this.courses = this.courses.filter((c) => c.courseId !== courseId);
        this.syncCohortCourseCount(cohortId, this.courses.length);
        snackbar.success(t.get('cohorts.course_removed') || 'Course removed');
      },
      logContext: 'removeCourseFromCohort'
    });
  }

  // Invitations (program-scoped)

  /**
   * Invite new students to a cohort by CSV. Goes through the cohort-scoped
   * endpoint so a Cohort ADMIN/TUTOR can invite without org-admin rights.
   * Returns whether the call succeeded so callers can refresh their lists.
   */
  async inviteStudentsToCohort(cohortId: string, data: TInviteStudentsToCohort): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['invite']['$post']>({
      requestFn: () => classroomio.cohort[':cohortId'].invite.$post({ param: { cohortId }, json: data }),
      onSuccess: async () => {
        await this.listMembers(cohortId, true);
        snackbar.success(t.get('cohorts.invite_sent') || 'Invites sent');
        ok = true;
      },
      logContext: 'inviteStudentsToCohort'
    });

    return ok;
  }

  /**
   * Assign existing org audience student profiles to this cohort.
   * Same scoping as `inviteStudentsToCohort` — caller only needs program-team
   * membership for this cohort.
   */
  async assignExistingStudentsToCohort(cohortId: string, data: TAssignExistingStudentsToCohort): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['invite']['assign']['$post']>({
      requestFn: () => classroomio.cohort[':cohortId'].invite.assign.$post({ param: { cohortId }, json: data }),
      onSuccess: async () => {
        await this.listMembers(cohortId, true);
        snackbar.success(t.get('cohorts.members_added') || 'Members added');
        ok = true;
      },
      logContext: 'assignExistingStudentsToCohort'
    });

    return ok;
  }

  // Newsfeed

  async listNewsfeed(cohortId: string, force = false, cursor?: string) {
    if (!force && this.loadedNewsfeedCohortId === cohortId) return;

    await this.execute<(typeof classroomio.cohort)[':cohortId']['newsfeed']['$get']>({
      requestFn: () =>
        classroomio.cohort[':cohortId'].newsfeed.$get({
          param: { cohortId },
          query: { limit: '10', ...(cursor ? { cursor } : {}) }
        }),
      onSuccess: (data) => {
        this.newsfeed = data.data;
        this.loadedNewsfeedCohortId = cohortId;
      },
      logContext: 'listCohortNewsfeed'
    });
  }

  // LMS — enrolled cohorts

  async listEnrolledCohorts() {
    await this.execute<typeof classroomio.cohort.enrolled.$get>({
      requestFn: () => classroomio.cohort.enrolled.$get({}),
      onSuccess: (data) => {
        this.cohorts = data.data;
      },
      logContext: 'listEnrolledCohorts'
    });
  }
}

export const cohortApi = new CohortApi();
