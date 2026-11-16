<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Input } from '@cio/ui/base/input';
  import * as Field from '@cio/ui/base/field';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { currentOrgDomain, isFreePlan } from '$lib/utils/store/org';
  import CompletionRulesSummary from './completion-rules-summary.svelte';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();

  const isComplianceCourse = $derived(courseApi.course?.type === 'COMPLIANCE');
  const expiresAfterMonths = $derived(courseApi.course?.certificate?.expiresAfterMonths ?? null);
  const certificatesExpire = $derived(expiresAfterMonths != null);
  const verifyAddressExample = $derived(`${$currentOrgDomain.replace(/\/$/, '')}/verify?code=XXXX-XXXX`);

  function updateCertificate(patch: Partial<NonNullable<typeof courseApi.course>['certificate']>) {
    if (!courseApi.course) return;

    courseApi.course.certificate = {
      ...(courseApi.course.certificate ?? {}),
      ...patch
    };
  }

  function onEmailMessageInput(e: Event) {
    delete errors['certificate.emailMessage'];
    updateCertificate({ emailMessage: (e.currentTarget as HTMLTextAreaElement).value || null });
  }

  function onExpireToggle(checked: boolean) {
    if (checked) {
      updateCertificate({ expiresAfterMonths: 12 });
    } else {
      updateCertificate({ expiresAfterMonths: null });
    }
  }

  function onMonthsInput(e: Event) {
    const value = parseInt((e.currentTarget as HTMLInputElement).value, 10);
    if (Number.isNaN(value)) return;
    const clamped = Math.max(1, Math.min(120, value));
    updateCertificate({ expiresAfterMonths: clamped });
  }
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
      </div>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <CompletionRulesSummary />

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.certification.validity_heading')}</Field.Legend>
    {#if isComplianceCourse}
      <p class="text-muted-foreground text-sm">{$t('course.certification.validity_compliance_note')}</p>
    {:else}
      <Field.Field orientation="horizontal">
        <Switch
          id="certificate-expire-toggle"
          checked={certificatesExpire}
          onCheckedChange={onExpireToggle}
          disabled={$isFreePlan}
        />
        <div class="flex-1">
          <Field.Label for="certificate-expire-toggle" class="text-gray-600">
            {$t('course.certification.validity_toggle')}
          </Field.Label>
        </div>
      </Field.Field>
      {#if certificatesExpire}
        <Field.Field>
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-sm">{$t('course.certification.validity_expires')}</span>
            <Input
              id="certificate-expire-months"
              type="number"
              min="1"
              max="120"
              value={String(expiresAfterMonths ?? 12)}
              oninput={onMonthsInput}
              disabled={$isFreePlan}
              class="w-20"
            />
            <span class="text-muted-foreground text-sm">{$t('course.certification.validity_months_suffix')}</span>
          </div>
          <p class="text-muted-foreground mt-2 text-xs">
            {$t('course.certification.validity_hint_expires', { months: String(expiresAfterMonths ?? 12) })}
          </p>
        </Field.Field>
      {:else}
        <p class="text-muted-foreground text-sm">{$t('course.certification.validity_never')}</p>
      {/if}
    {/if}
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.certification.public_verification_heading')}</Field.Legend>
    <p class="text-muted-foreground text-sm">{$t('course.certification.public_verification_description')}</p>
    <Field.Field>
      <Input
        readonly
        value={verifyAddressExample}
        class="font-mono text-sm"
        aria-label={$t('course.certification.verification_address')}
      />
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
