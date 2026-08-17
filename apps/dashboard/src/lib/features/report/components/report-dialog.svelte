<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import {
    CONTENT_REPORT_REASONS,
    ZCreateContentReport,
    type TContentReportReason
  } from '@cio/utils/validation/report';
  import { reportApi } from '../api/report.svelte';
  import { reportDialog } from '../store/report-dialog.svelte';

  let reason = $state<TContentReportReason | ''>('');
  let details = $state('');

  function resetForm() {
    reason = '';
    details = '';
    reportApi.reset();
  }

  function handleOpenChange(isOpen: boolean) {
    reportDialog.handleOpenChange(isOpen);

    if (!isOpen) {
      resetForm();
    }
  }

  async function handleSubmit() {
    if (!reportDialog.targetType || !reportDialog.targetId) {
      return;
    }

    const parsed = ZCreateContentReport.safeParse({
      targetType: reportDialog.targetType,
      targetId: reportDialog.targetId,
      reason: reason || undefined,
      details
    });

    if (!parsed.success) {
      reportApi.errors = {
        reason: parsed.error.issues.some((issue) => issue.path[0] === 'reason') ? 'report.reason_required' : ''
      };
      return;
    }

    await reportApi.submit(parsed.data);

    if (reportApi.success) {
      handleOpenChange(false);
    }
  }
</script>

<Dialog.Root open={reportDialog.open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('report.title')}</Dialog.Title>
      <Dialog.Description>{$t('report.description')}</Dialog.Description>
    </Dialog.Header>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('report.reason_label')}</Field.Label>
        <Select.Root type="single" bind:value={reason}>
          <Select.Trigger class="w-full">
            {reason ? $t(`report.reasons.${reason}`) : $t('report.reason_placeholder')}
          </Select.Trigger>
          <Select.Content>
            {#each CONTENT_REPORT_REASONS as reportReason (reportReason)}
              <Select.Item value={reportReason}>{$t(`report.reasons.${reportReason}`)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if reportApi.errors.reason}
          <Field.Error>{$t('report.reason_required')}</Field.Error>
        {/if}
      </Field.Field>

      <TextareaField
        label={$t('report.details_label')}
        placeholder={$t('report.details_placeholder')}
        bind:value={details}
        errorMessage={reportApi.errors.details}
      />
    </Field.Group>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => handleOpenChange(false)} disabled={reportApi.isLoading}>
        {$t('report.cancel')}
      </Button>
      <Button onclick={handleSubmit} loading={reportApi.isLoading} disabled={!reason}>
        {$t('report.submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
