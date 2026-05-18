import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type { Program, ProgramDetail, ProgramMember, ProgramCourse, ProgramNewsfeed } from '../utils/types';
import type {
  TCreateProgram,
  TUpdateProgram,
  TAddProgramMembers,
  TUpdateProgramMember,
  TAddCourseToProgram,
  TInviteStudentsToProgram,
  TAssignExistingStudentsToProgram
} from '@cio/utils/validation/program';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import { isStudentExperience } from '$lib/utils/store/app';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';

class ProgramApi extends BaseApiWithErrors {
  programs = $state<Program[]>([]);
  program = $state<ProgramDetail | null>(null);
  members = $state<ProgramMember[]>([]);
  courses = $state<ProgramCourse[]>([]);
  newsfeed = $state<ProgramNewsfeed | null>(null);
  isProgramShellLoading = $state(false);
  currentProgramId = $state<string | null>(null);

  loadedProgramId = $state<string | null>(null);
  loadedMembersProgramId = $state<string | null>(null);
  loadedCoursesProgramId = $state<string | null>(null);
  loadedCoursesStudentExperience = $state<boolean | null>(null);
  loadedNewsfeedProgramId = $state<string | null>(null);

  syncProgramCourseCount(programId: string, courseCount: number) {
    this.programs = this.programs.map((program) => (program.id === programId ? { ...program, courseCount } : program));
  }

  async listPrograms() {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<typeof classroomio.program.$get>({
      requestFn: () => classroomio.program.$get({ query: { organizationId: org.id } }),
      onSuccess: (data) => {
        this.programs = data.data;
      },
      logContext: 'listPrograms'
    });
  }

  async getProgram(programId: string, force = false) {
    if (!force && this.loadedProgramId === programId) return;

    await this.execute<(typeof classroomio.program)[':programId']['$get']>({
      requestFn: () => classroomio.program[':programId'].$get({ param: { programId } }),
      onSuccess: (data) => {
        this.program = data.data;
        this.loadedProgramId = programId;
      },
      logContext: 'getProgram'
    });
  }

  resetProgramShell(programId?: string) {
    this.currentProgramId = programId ?? null;
    this.program = null;
    this.members = [];
    this.courses = [];
    this.newsfeed = null;
    this.loadedProgramId = null;
    this.loadedMembersProgramId = null;
    this.loadedCoursesProgramId = null;
    this.loadedCoursesStudentExperience = null;
    this.loadedNewsfeedProgramId = null;
  }

  async ensureProgramShell(programId: string, force = false) {
    const studentExperience = get(isStudentExperience);
    const isShellReady =
      this.loadedProgramId === programId &&
      this.loadedMembersProgramId === programId &&
      this.loadedCoursesProgramId === programId &&
      this.loadedCoursesStudentExperience === studentExperience;

    if (!force && isShellReady) {
      return;
    }

    const isProgramChanged = this.currentProgramId !== programId;
    if (force || isProgramChanged) {
      this.resetProgramShell(programId);
    }

    this.currentProgramId = programId;
    this.isProgramShellLoading = true;

    try {
      await Promise.all([
        this.getProgram(programId, force),
        this.listMembers(programId, force),
        this.listCourses(programId, force)
      ]);
    } finally {
      this.isProgramShellLoading = false;
    }
  }

  async createProgram(data: TCreateProgram) {
    const org = get(currentOrg);
    if (!org.id) return;

    await this.execute<typeof classroomio.program.$post>({
      requestFn: () =>
        classroomio.program.$post({
          json: { ...data, organizationId: org.id }
        }),
      onSuccess: (res) => {
        this.programs = [res.data, ...this.programs];
        snackbar.success(t.get('programs.create_success') || 'Program created');
      },
      logContext: 'createProgram'
    });
  }

  async updateProgram(programId: string, data: TUpdateProgram) {
    await this.execute<(typeof classroomio.program)[':programId']['$put']>({
      requestFn: () => classroomio.program[':programId'].$put({ param: { programId }, json: data }),
      onSuccess: (res) => {
        this.program = res.data;
        this.programs = this.programs.map((p) => (p.id === programId ? { ...p, ...res.data } : p));
        snackbar.success(t.get('programs.update_success') || 'Program updated');
      },
      onError: (result) => {
        const message = typeof result === 'string' ? result : result.error;
        snackbar.error(message || 'Failed to update program');
      },
      logContext: 'updateProgram'
    });
  }

  async deleteProgram(programId: string) {
    await this.execute<(typeof classroomio.program)[':programId']['$delete']>({
      requestFn: () => classroomio.program[':programId'].$delete({ param: { programId } }),
      onSuccess: () => {
        this.programs = this.programs.filter((p) => p.id !== programId);
        snackbar.success(t.get('programs.delete_success') || 'Program deleted');
      },
      logContext: 'deleteProgram'
    });
  }

  // Members

  async listMembers(programId: string, force = false) {
    if (!force && this.loadedMembersProgramId === programId) return;

    await this.execute<(typeof classroomio.program)[':programId']['members']['$get']>({
      requestFn: () => classroomio.program[':programId'].members.$get({ param: { programId } }),
      onSuccess: (data) => {
        this.members = data.data;
        this.loadedMembersProgramId = programId;
      },
      logContext: 'listProgramMembers'
    });
  }

  async addMembers(programId: string, data: TAddProgramMembers) {
    await this.execute<(typeof classroomio.program)[':programId']['members']['$post']>({
      requestFn: () => classroomio.program[':programId'].members.$post({ param: { programId }, json: data }),
      onSuccess: async () => {
        await this.listMembers(programId, true);
        snackbar.success(t.get('programs.members_added') || 'Members added');
      },
      logContext: 'addProgramMembers'
    });
  }

  async updateMember(programId: string, memberId: string, data: TUpdateProgramMember) {
    await this.execute<(typeof classroomio.program)[':programId']['members'][':memberId']['$put']>({
      requestFn: () =>
        classroomio.program[':programId'].members[':memberId'].$put({
          param: { programId, memberId },
          json: data
        }),
      onSuccess: (res) => {
        this.members = this.members.map((m) => (m.id === memberId ? { ...m, ...res.data } : m));
      },
      logContext: 'updateProgramMember'
    });
  }

  async removeMember(programId: string, memberId: string) {
    await this.execute<(typeof classroomio.program)[':programId']['members'][':memberId']['$delete']>({
      requestFn: () =>
        classroomio.program[':programId'].members[':memberId'].$delete({
          param: { programId, memberId }
        }),
      onSuccess: () => {
        this.members = this.members.filter((m) => m.id !== memberId);
        snackbar.success(t.get('programs.member_removed') || 'Member removed');
      },
      logContext: 'removeProgramMember'
    });
  }

  // Courses

  async listCourses(programId: string, force = false) {
    const studentExperience = get(isStudentExperience);

    if (
      !force &&
      this.loadedCoursesProgramId === programId &&
      this.loadedCoursesStudentExperience === studentExperience
    ) {
      return;
    }

    await this.execute<(typeof classroomio.program)[':programId']['courses']['$get']>({
      requestFn: () => classroomio.program[':programId'].courses.$get({ param: { programId } }),
      onSuccess: (data) => {
        this.courses = data.data;
        this.syncProgramCourseCount(programId, data.data.length);
        this.loadedCoursesProgramId = programId;
        this.loadedCoursesStudentExperience = studentExperience;
      },
      logContext: 'listProgramCourses'
    });
  }

  async addCourse(programId: string, data: TAddCourseToProgram) {
    await this.execute<(typeof classroomio.program)[':programId']['courses']['$post']>({
      requestFn: () => classroomio.program[':programId'].courses.$post({ param: { programId }, json: data }),
      onSuccess: async () => {
        await this.listCourses(programId, true);
        this.syncProgramCourseCount(programId, this.courses.length);
        snackbar.success(t.get('programs.course_added') || 'Course added');
      },
      logContext: 'addCourseToProgram'
    });
  }

  async addCourses(programId: string, courseIds: string[]) {
    if (courseIds.length === 0) {
      return false;
    }

    this.isLoading = true;
    this.error = null;
    this.success = false;

    try {
      for (const courseId of courseIds) {
        const response = await classroomio.program[':programId'].courses.$post({
          param: { programId },
          json: { courseId }
        });
        const result = (await response.json()) as { success?: boolean; error?: string };

        if (!result.success) {
          this.error = result.error ?? 'Failed to add course to program';
          return false;
        }
      }

      await this.listCourses(programId, true);
      this.syncProgramCourseCount(programId, this.courses.length);

      const successMessage =
        courseIds.length === 1
          ? t.get('programs.course_added') || 'Course added'
          : t.get('programs.multiple_added') || 'Courses added';

      snackbar.success(successMessage);
      this.success = true;
      return true;
    } catch (error) {
      console.error('Error in addCoursesToProgram:', error);
      this.error = error instanceof Error ? error.message : 'Failed to add courses to program';
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  async removeCourse(programId: string, courseId: string) {
    await this.execute<(typeof classroomio.program)[':programId']['courses'][':courseId']['$delete']>({
      requestFn: () =>
        classroomio.program[':programId'].courses[':courseId'].$delete({
          param: { programId, courseId }
        }),
      onSuccess: () => {
        this.courses = this.courses.filter((c) => c.courseId !== courseId);
        this.syncProgramCourseCount(programId, this.courses.length);
        snackbar.success(t.get('programs.course_removed') || 'Course removed');
      },
      logContext: 'removeCourseFromProgram'
    });
  }

  // Invitations (program-scoped)

  /**
   * Invite new students to a program by CSV. Goes through the program-scoped
   * endpoint so a Program ADMIN/TUTOR can invite without org-admin rights.
   * Returns whether the call succeeded so callers can refresh their lists.
   */
  async inviteStudentsToProgram(programId: string, data: TInviteStudentsToProgram): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.program)[':programId']['invite']['$post']>({
      requestFn: () => classroomio.program[':programId'].invite.$post({ param: { programId }, json: data }),
      onSuccess: async () => {
        await this.listMembers(programId, true);
        snackbar.success(t.get('programs.invite_sent') || 'Invites sent');
        ok = true;
      },
      logContext: 'inviteStudentsToProgram'
    });

    return ok;
  }

  /**
   * Assign existing org audience student profiles to this program.
   * Same scoping as `inviteStudentsToProgram` — caller only needs program-team
   * membership for this program.
   */
  async assignExistingStudentsToProgram(programId: string, data: TAssignExistingStudentsToProgram): Promise<boolean> {
    let ok = false;

    await this.execute<(typeof classroomio.program)[':programId']['invite']['assign']['$post']>({
      requestFn: () => classroomio.program[':programId'].invite.assign.$post({ param: { programId }, json: data }),
      onSuccess: async () => {
        await this.listMembers(programId, true);
        snackbar.success(t.get('programs.members_added') || 'Members added');
        ok = true;
      },
      logContext: 'assignExistingStudentsToProgram'
    });

    return ok;
  }

  // Newsfeed

  async listNewsfeed(programId: string, force = false, cursor?: string) {
    if (!force && this.loadedNewsfeedProgramId === programId) return;

    await this.execute<(typeof classroomio.program)[':programId']['newsfeed']['$get']>({
      requestFn: () =>
        classroomio.program[':programId'].newsfeed.$get({
          param: { programId },
          query: { limit: '10', ...(cursor ? { cursor } : {}) }
        }),
      onSuccess: (data) => {
        this.newsfeed = data.data;
        this.loadedNewsfeedProgramId = programId;
      },
      logContext: 'listProgramNewsfeed'
    });
  }

  // LMS — enrolled programs

  async listEnrolledPrograms() {
    await this.execute<typeof classroomio.program.enrolled.$get>({
      requestFn: () => classroomio.program.enrolled.$get({}),
      onSuccess: (data) => {
        this.programs = data.data;
      },
      logContext: 'listEnrolledPrograms'
    });
  }
}

export const programApi = new ProgramApi();
