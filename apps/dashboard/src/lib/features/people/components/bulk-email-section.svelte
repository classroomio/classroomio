<script lang="ts">
  import * as Field from '@cio/ui/base/field';
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
    disabled?: boolean;
  }

  let {
    onInvite,
    titleKey = 'course.navItem.people.invite_modal.invite_new_students_title',
    descriptionKey = 'course.navItem.people.invite_modal.invite_new_students_description',
    submitKey = 'course.navItem.people.invite_modal.invite_new_students',
    noEmailsKey = 'audience.import.snackbar_no_emails',
    disabled = false
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

<Field.Set>
  <Field.Legend>{$t(titleKey)}</Field.Legend>
  <Field.Description>{$t(descriptionKey)}</Field.Description>

  <Field.Group>
    <TextareaField
      label={$t('audience.import.emails_label')}
      bind:value={recipientCsv}
      rows={4}
      className="w-full"
      {disabled}
      placeholder={$t('audience.import.emails_placeholder')}
    />
    <CheckboxField
      name="send-invite-emails"
      label={$t('audience.import.send_email')}
      bind:checked={sendInviteEmails}
      {disabled}
    />
  </Field.Group>

  <Button variant="secondary" onclick={inviteStudents} loading={isSubmitting} {disabled}>
    {$t(submitKey)}
  </Button>
</Field.Set>
