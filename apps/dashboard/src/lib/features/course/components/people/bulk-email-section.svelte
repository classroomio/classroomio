<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { t } from '$lib/utils/functions/translations';
  import { inviteSettingsStore, studentInviteLinkStore } from './store';
  import { getInvitePayload } from './invite-utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { peopleApi } from '$features/course/api';

  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  interface Props {
    courseId: string;
    onInviteCreated?: () => void;
  }

  let { courseId, onInviteCreated }: Props = $props();

  let recipientCsv = $state('');
  let sendInviteEmails = $state(true);

  async function createEmailInvites() {
    if (!courseId) return;
    if (!recipientCsv.trim()) {
      snackbar.error(`${INVITE_MODAL}.snackbar_add_one_recipient`);
      return;
    }

    studentInviteLinkStore.update((s) => ({ ...s, isCreating: true }));
    try {
      const settings = $inviteSettingsStore;
      const payload = getInvitePayload(settings);
      const response = await peopleApi.createStudentInvite(courseId, {
        ...payload,
        recipientCsv,
        sendEmail: sendInviteEmails
      });

      const createdCount = response?.invites?.length || 0;
      const sent = response?.delivery?.sent || 0;
      const failed = response?.delivery?.failed || 0;
      const duplicates = response?.duplicatesSkipped?.length || 0;

      snackbar.success(
        $t(`${INVITE_MODAL}.snackbar_email_invites_success`, {
          count: createdCount,
          sent,
          failed,
          duplicates
        })
      );

      recipientCsv = '';
      onInviteCreated?.();
    } catch (error) {
      console.error('Failed to create email invites', error);
      snackbar.error(`${INVITE_MODAL}.snackbar_failed_create_email_invites`);
    } finally {
      studentInviteLinkStore.update((s) => ({ ...s, isCreating: false }));
    }
  }

  const isCreating = $derived($studentInviteLinkStore.isCreating);
</script>

<div class="rounded-md border p-4">
  <p class="mb-2 text-base font-semibold">{$t(`${INVITE_MODAL}.direct_email_bulk`)}</p>
  <p class="ui:text-muted-foreground mb-2 text-sm">
    {$t(`${INVITE_MODAL}.direct_email_description`)}
  </p>
  <TextareaField
    label={$t(`${INVITE_MODAL}.recipient_emails`)}
    bind:value={recipientCsv}
    rows={4}
    className="w-full"
    placeholder={$t(`${INVITE_MODAL}.recipient_emails_placeholder`)}
  />
  <CheckboxField
    className="mt-2"
    name="send-invite-emails"
    label={$t(`${INVITE_MODAL}.send_invite_emails`)}
    bind:checked={sendInviteEmails}
  />
  <div class="mt-3">
    <Button variant="secondary" onclick={createEmailInvites} loading={isCreating}>
      {$t(`${INVITE_MODAL}.create_email_invites`)}
    </Button>
  </div>
</div>
