import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  GetMemberEmailNotificationsRequest,
  UpdateMemberEmailNotificationsRequest
} from '$features/settings/utils/types';

class MemberEmailNotificationsApi extends BaseApiWithErrors {
  async fetch() {
    return this.execute<GetMemberEmailNotificationsRequest>({
      requestFn: () => classroomio.organization.member['email-notifications'].$get(),
      logContext: 'fetching member email notification preferences'
    });
  }

  async update(preferences: Record<string, boolean>) {
    return this.execute<UpdateMemberEmailNotificationsRequest>({
      requestFn: () => classroomio.organization.member['email-notifications'].$put({ json: preferences }),
      logContext: 'updating member email notification preferences'
    });
  }
}

export const memberEmailNotificationsApi = new MemberEmailNotificationsApi();
