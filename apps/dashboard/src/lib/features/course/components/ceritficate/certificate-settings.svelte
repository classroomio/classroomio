<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import * as Field from '@cio/ui/base/field';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { isFreePlan } from '$lib/utils/store/org';
  import type { CourseCertificate } from '$features/course/utils/types';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();

  function updateCertificate(patch: Partial<NonNullable<typeof courseApi.course>['certificate']>) {
    if (!courseApi.course) return;

    courseApi.course.certificate = {
      ...(courseApi.course.certificate ?? {}),
      ...patch
    };
  }

  function onEmailMessageInput(e: Event) {
    updateCertificate({ emailMessage: (e.currentTarget as HTMLTextAreaElement).value || null });
  }

  function validateCertificateSettings(certificate: CourseCertificate | null | undefined): string[] {
    const errors: string[] = [];
    if (certificate?.isDownloadable && !certificate?.deadline) {
      errors.push('course.certification.deadline_required');
    }
    return errors;
  }

  const certificateValidationErrors = $derived(validateCertificateSettings(courseApi.course?.certificate));
</script>

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('course.certification.rules_heading')}</Field.Legend>

    <Field.Field orientation="horizontal">
      <Switch
        id="certificate-downloadable"
        checked={!!courseApi.course?.certificate?.isDownloadable}
        onCheckedChange={(checked) => {
          updateCertificate({ isDownloadable: checked });
        }}
        disabled={$isFreePlan}
      />
      <div class="flex-1">
        <Field.Label for="certificate-downloadable" class="text-gray-600">
          {$t('course.navItem.certificates.allow')}
        </Field.Label>
        {#if courseApi.course?.certificate?.isDownloadable && certificateValidationErrors.includes('course.certification.deadline_required')}
          <Field.Error class="mt-1">{$t('course.certification.deadline_required')}</Field.Error>
        {/if}
      </div>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.certification.email_message_label')}</Field.Legend>
    <Field.Field>
      <Textarea
        id="cert-email-message"
        class="w-full"
        rows={4}
        placeholder={$t('course.certification.email_message_placeholder')}
        value={courseApi.course?.certificate?.emailMessage ?? ''}
        oninput={onEmailMessageInput}
        disabled={$isFreePlan}
      />
      {#if errors['certificate.emailMessage']}
        <Field.Error>{errors['certificate.emailMessage']}</Field.Error>
      {/if}
    </Field.Field>
  </Field.Set>
</Field.Group>
