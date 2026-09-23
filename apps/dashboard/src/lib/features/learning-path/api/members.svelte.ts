import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  AddPathMembersRequest,
  GetPathMemberDetailRequest,
  LearningPathMemberItem,
  ListPathMembersRequest,
  PathMemberDetail,
  PathMembersListOptions,
  PathMembersPagination,
  RemovePathMemberRequest
} from '../utils/types';
import { ROLE } from '@cio/utils/constants';
import { snackbar } from '$features/ui/snackbar/store';
import { toPathMembersRequestQuery } from '../utils/path-people-utils';

class PathMembersApi extends BaseApiWithErrors {
  members = $state<LearningPathMemberItem[]>([]);
  membersPagination = $state<PathMembersPagination | null>(null);
  membersStudentsTotal = $state<number | null>(null);
  isLoadingMembers = $state(false);
  private membersRequestSeq = 0;

  memberDetail = $state<PathMemberDetail | null>(null);
  isLoadingMemberDetail = $state(false);
  loadErrorMemberDetail = $state(false);
  private memberDetailRequestSeq = 0;

  /**
   * The viewer's own path role, resolved independently of the paginated,
   * filtered member table (which may not contain the viewer's row).
   * `undefined` = not yet resolved, `null` = no active membership.
   */
  viewerRole = $state<number | null | undefined>(undefined);
  private viewerRoleRequestSeq = 0;

  async listMembers(pathId: string, options: PathMembersListOptions) {
    const seq = ++this.membersRequestSeq;
    this.isLoadingMembers = true;

    const query = toPathMembersRequestQuery(options);

    await this.execute<ListPathMembersRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['members'].$get({
          param: { pathId },
          query
        }),
      logContext: 'listing path members',
      onSuccess: (result) => {
        if (seq !== this.membersRequestSeq) return;
        this.members = result.data.data;
        this.membersPagination = result.data.pagination;
        this.membersStudentsTotal = result.data.studentsTotal;
      }
    });
    if (seq === this.membersRequestSeq) {
      this.isLoadingMembers = false;
    }
  }

  async addMembers(
    pathId: string,
    members: Array<{ profileId?: string; email?: string; roleId: (typeof ROLE)['TUTOR' | 'STUDENT'] }>,
    options: { successKey?: string } = {}
  ) {
    const { successKey = 'learningPath.snackbar.members_added' } = options;
    const res = await this.execute<AddPathMembersRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['members'].$post({
          param: { pathId },
          json: { members }
        }),
      logContext: 'adding path members',
      onSuccess: () => {
        snackbar.success(successKey);
      }
    });

    return res;
  }

  async removeMember(pathId: string, memberId: string, options: { isStudent?: boolean } = {}) {
    const { isStudent = true } = options;
    const res = await this.execute<RemovePathMemberRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['members'][':memberId'].$delete({
          param: { pathId, memberId }
        }),
      logContext: 'removing path member',
      onSuccess: () => {
        this.members = this.members.filter((m) => m.id !== memberId);
        snackbar.success(isStudent ? 'learningPath.snackbar.member_removed' : 'learningPath.snackbar.tutor_removed');
      }
    });

    return res;
  }

  async getMemberDetail(pathId: string, personId: string) {
    const seq = ++this.memberDetailRequestSeq;
    // Clear first so member-to-member navigation shows the loader instead of
    // the previous member's ring briefly updating to the new values.
    this.memberDetail = null;
    this.isLoadingMemberDetail = true;
    this.loadErrorMemberDetail = false;

    await this.execute<GetPathMemberDetailRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['members'][':personId'].$get({
          param: { pathId, personId }
        }),
      logContext: 'getting path member detail',
      onSuccess: (result) => {
        if (seq !== this.memberDetailRequestSeq) return;
        this.memberDetail = result.data;
      },
      onError: () => {
        if (seq !== this.memberDetailRequestSeq) return;
        this.memberDetail = null;
        this.loadErrorMemberDetail = true;
      }
    });
    if (seq === this.memberDetailRequestSeq) {
      this.isLoadingMemberDetail = false;
    }
  }

  /**
   * Resolves the viewer's own active path role without depending on the
   * currently displayed member page (pagination/search/role filters can
   * exclude the viewer's row). Uses the member-detail endpoint, which is
   * already authorized by `assertCanManageLearningPath`.
   */
  async fetchViewerRole(pathId: string, profileId: string) {
    const seq = ++this.viewerRoleRequestSeq;
    this.viewerRole = undefined;

    await this.execute<GetPathMemberDetailRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['members'][':personId'].$get({
          param: { pathId, personId: profileId }
        }),
      logContext: 'getting path viewer role',
      onSuccess: (result) => {
        if (seq !== this.viewerRoleRequestSeq) return;
        this.viewerRole = Number(result.data.member.roleId);
      },
      onError: () => {
        if (seq !== this.viewerRoleRequestSeq) return;
        this.viewerRole = null;
      }
    });
  }
}

export const pathMembersApi = new PathMembersApi();
