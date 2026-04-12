<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    onInvite: (recipientCsv: string, sendEmail: boolean) => void | Promise<void>;
    titleKey?: string;
    descriptionKey?: string;
    submitKey?: string;
    noEmailsKey?: string;
  }

  let {
    onInvite,
    titleKey = 'course.navItem.people.invite_modal.invite_new_students_title',
    descriptionKey = 'course.navItem.people.invite_modal.invite_new_students_description',
    submitKey = 'course.navItem.people.invite_modal.invite_new_students',
    noEmailsKey = 'audience.import.snackbar_no_emails'
  }: Props = $props();

  let recipientCsv = $state('');
  let sendInviteEmails = $state(true);
  let isSubmitting = $state(false);

  async function inviteStudents() {
    if (!recipientCsv.trim()) {
      snackbar.error(noEmailsKey);
      return;
    }

    isSubmitting = true;

    try {
      await onInvite(recipientCsv, sendInviteEmails);
      recipientCsv = '';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="rounded-md border p-4">
  <p class="mb-2 text-base font-semibold">{$t(titleKey)}</p>
  <p class="ui:text-muted-foreground mb-2 text-sm">
    {$t(descriptionKey)}
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
    <Button variant="secondary" onclick={inviteStudents} loading={isSubmitting}>
      {$t(submitKey)}
    </Button>
  </div>
</div>
