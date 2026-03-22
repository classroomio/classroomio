<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { orgApi } from '$features/org/api/org.svelte';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';

  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  interface Props {
    courseId: string;
    onInviteCreated?: () => void;
  }

  let { courseId, onInviteCreated }: Props = $props();

  let recipientCsv = $state('');
  let sendInviteEmails = $state(true);
  let isSubmitting = $state(false);

  async function inviteNewStudents() {
    if (!courseId) return;
    if (!recipientCsv.trim()) {
      snackbar.error('audience.import.snackbar_no_emails');
      return;
    }

    isSubmitting = true;
    try {
      const response = await orgApi.importAudienceMembers({
        recipientCsv,
        courseIds: [courseId],
        sendEmail: sendInviteEmails
      });

      if (response) {
        recipientCsv = '';
        await courseApi.refreshCourse(courseId, $profile.id);
        await onInviteCreated?.();
      }
    } catch (error) {
      console.error('Failed to invite new students into organization', error);
      snackbar.error('audience.import.snackbar_failed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="rounded-md border p-4">
  <p class="mb-2 text-base font-semibold">{$t(`${INVITE_MODAL}.invite_new_students_title`)}</p>
  <p class="ui:text-muted-foreground mb-2 text-sm">
    {$t(`${INVITE_MODAL}.invite_new_students_description`)}
  </p>
  <TextareaField
    label={$t('audience.import.emails_label')}
    bind:value={recipientCsv}
    rows={4}
    className="w-full"
    placeholder={$t('audience.import.emails_placeholder')}
  />
  <CheckboxField
    className="mt-2"
    name="send-invite-emails"
    label={$t('audience.import.send_email')}
    bind:checked={sendInviteEmails}
  />
  <div class="mt-3">
    <Button variant="secondary" onclick={inviteNewStudents} loading={isSubmitting}>
      {$t(`${INVITE_MODAL}.invite_new_students`)}
    </Button>
  </div>
</div>
