import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreatePathInviteLinkRequest,
  GetPathInviteLinkRequest,
  PathInviteLink,
  TogglePathInviteLinkRequest
} from '../utils/types';
import { snackbar } from '$features/ui/snackbar/store';

class PathInviteLinkApi extends BaseApiWithErrors {
  inviteLink = $state<PathInviteLink>(null);
  private activeInviteLinkPathId: string | null = $state(null);
  private inviteLinkRequestSeq = 0;

  private applyInviteLink(pathId: string, seq: number, invite: PathInviteLink) {
    if (this.activeInviteLinkPathId !== pathId) return;
    if (seq !== this.inviteLinkRequestSeq) return;

    this.inviteLink = invite;
  }

  private beginInviteLinkRequest(pathId: string): number {
    if (this.activeInviteLinkPathId !== pathId) {
      this.activeInviteLinkPathId = pathId;
      this.inviteLink = null;
    }

    this.inviteLinkRequestSeq += 1;

    return this.inviteLinkRequestSeq;
  }

  async getInviteLink(pathId: string) {
    const seq = this.beginInviteLinkRequest(pathId);

    await this.execute<GetPathInviteLinkRequest>({
      requestFn: () => classroomio['learning-path'][':pathId']['invite-link'].$get({ param: { pathId } }),
      onSuccess: (result) => this.applyInviteLink(pathId, seq, result.data),
      onError: () => snackbar.error('invite_link.load_failed'),
      logContext: 'getPathInviteLink'
    });
  }

  async generateInviteLink(pathId: string) {
    const seq = this.beginInviteLinkRequest(pathId);

    await this.execute<CreatePathInviteLinkRequest>({
      requestFn: () => classroomio['learning-path'][':pathId']['invite-link'].$post({ param: { pathId } }),
      onSuccess: (result) => this.applyInviteLink(pathId, seq, result.data),
      onError: () => snackbar.error('invite_link.generate_failed'),
      logContext: 'generatePathInviteLink'
    });
  }

  async toggleInviteLink(pathId: string, isRevoked: boolean) {
    const seq = this.beginInviteLinkRequest(pathId);

    await this.execute<TogglePathInviteLinkRequest>({
      requestFn: () =>
        classroomio['learning-path'][':pathId']['invite-link'].$patch({ param: { pathId }, json: { isRevoked } }),
      onSuccess: (result) => {
        this.applyInviteLink(pathId, seq, result.data);
        snackbar.success(isRevoked ? 'invite_link.snackbar.disabled' : 'invite_link.snackbar.enabled');
      },
      onError: () => snackbar.error('invite_link.toggle_failed'),
      logContext: 'togglePathInviteLink'
    });
  }
}

export const pathInviteLinkApi = new PathInviteLinkApi();
