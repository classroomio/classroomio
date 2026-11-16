<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Select from '@cio/ui/base/select';
  import * as Field from '@cio/ui/base/field';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { CopyInput } from '@cio/ui/custom/copy-input';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { STUDENT_REPORT_COMMENT_MAX_LENGTH, STUDENT_REPORT_EXPIRY_DAYS } from '@cio/utils/validation/student-report';

  import { studentReportApi } from '$features/student-report/api';
  import {
    getDefaultReportPeriod,
    getReportLinkStatus,
    toPeriodBounds,
    type CreatedStudentReport,
    type ReportStudent
  } from '$features/student-report/utils';
  import { UpgradeBanner } from '$features/ui';
  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
    courseId: string;
    students: ReportStudent[];
  }

  let { open = $bindable(false), courseId, students }: Props = $props();

  const defaultPeriod = getDefaultReportPeriod();
  const isSingle = $derived(students.length === 1);

  let periodStart = $state(defaultPeriod.start);
  let periodEnd = $state(defaultPeriod.end);
  let teacherComment = $state('');
  let parentEmail = $state('');
  let sendToParent = $state(false);
  let expiresInDays = $state('30');
  let created = $state<CreatedStudentReport[] | null>(null);

  const nameByProfile = $derived(new Map(students.map((student) => [student.profileId, student.name])));

  $effect(() => {
    if (!open) return;

    created = null;
    teacherComment = '';
    parentEmail = '';
    sendToParent = false;
    studentReportApi.history = [];
    if (students.length === 1) void studentReportApi.loadHistory(courseId, students[0].profileId);
  });

  async function handleSubmit() {
    const reports = await studentReportApi.create(courseId, {
      profileIds: students.map((student) => student.profileId),
      ...toPeriodBounds(periodStart, periodEnd),
      teacherComment: teacherComment.trim() || undefined,
      parentEmail: isSingle && parentEmail.trim() ? parentEmail.trim() : undefined,
      expiresInDays: Number(expiresInDays),
      sendToParent: isSingle && sendToParent && Boolean(parentEmail.trim())
    });
    if (!reports) return;

    created = reports;
    if (isSingle) void studentReportApi.loadHistory(courseId, students[0].profileId);
  }

  async function handleRevoke(reportId: string) {
    const revoked = await studentReportApi.revoke(courseId, reportId);
    if (revoked && isSingle) await studentReportApi.loadHistory(courseId, students[0].profileId);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="create-report-dialog">
    <Dialog.Header>
      <Dialog.Title>
        {isSingle
          ? $t('student_report.dialog.title_single', { name: students[0].name })
          : $t('student_report.dialog.title_bulk', { count: students.length })}
      </Dialog.Title>
      <Dialog.Description>{$t('student_report.dialog.description')}</Dialog.Description>
    </Dialog.Header>

    {#if created}
      <div class="flex flex-col gap-3" data-testid="report-links">
        <p class="text-sm font-medium">{$t('student_report.dialog.links_ready')}</p>
        {#each created as report (report.reportId)}
          <div class="flex flex-col gap-2 rounded-md border p-3">
            <p class="text-sm font-medium">{nameByProfile.get(report.profileId)}</p>
            <CopyInput
              value={report.url}
              copyLabel={$t('student_report.dialog.copy')}
              copiedLabel={$t('student_report.dialog.copied')}
              testId="report-link-input"
            />
            <div>
              <Button size="sm" variant="outline" href={report.url} target="_blank" testId="report-open-link">
                {$t('student_report.dialog.open')}
              </Button>
            </div>
          </div>
        {/each}
        <Dialog.Footer>
          <Button size="sm" onclick={() => (open = false)}>{$t('student_report.dialog.done')}</Button>
        </Dialog.Footer>
      </div>
    {:else}
      <UpgradeBanner>{$t('upgrade.paid_math_feature')}</UpgradeBanner>

      <Field.Group>
        <Field.Set>
          <Field.Legend>{$t('student_report.dialog.period')}</Field.Legend>
          <div class="grid grid-cols-2 gap-3">
            <InputField
              type="date"
              label={$t('student_report.dialog.period_start')}
              bind:value={periodStart}
              testId="report-period-start"
            />
            <InputField
              type="date"
              label={$t('student_report.dialog.period_end')}
              bind:value={periodEnd}
              testId="report-period-end"
            />
          </div>
        </Field.Set>

        <Field.Field>
          <TextareaField
            label={$t('student_report.dialog.comment')}
            placeholder={$t('student_report.dialog.comment_placeholder')}
            maxlength={STUDENT_REPORT_COMMENT_MAX_LENGTH}
            rows={4}
            bind:value={teacherComment}
            testId="report-comment"
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('student_report.dialog.expiry')}</Field.Label>
          <Select.Root type="single" bind:value={expiresInDays}>
            <Select.Trigger class="w-full" data-testid="report-expiry">
              {$t('student_report.dialog.expiry_days', { days: expiresInDays })}
            </Select.Trigger>
            <Select.Content>
              {#each STUDENT_REPORT_EXPIRY_DAYS as days (days)}
                <Select.Item value={String(days)}>{$t('student_report.dialog.expiry_days', { days })}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>

        {#if isSingle}
          <Field.Set>
            <Field.Group>
              <InputField
                type="email"
                label={$t('student_report.dialog.parent_email')}
                placeholder="parent@example.com"
                bind:value={parentEmail}
                testId="report-parent-email"
              />
              <CheckboxField
                label={$t('student_report.dialog.send_to_parent')}
                checked={sendToParent}
                disabled={!parentEmail.trim()}
                onclick={() => (sendToParent = !sendToParent)}
                testId="report-send-to-parent"
              />
            </Field.Group>
          </Field.Set>
        {/if}
      </Field.Group>

      {#if isSingle && studentReportApi.history.length > 0}
        <Field.Separator />
        <div class="flex flex-col gap-2" data-testid="report-history">
          <p class="text-sm font-medium">{$t('student_report.history.heading')}</p>
          {#each studentReportApi.history as item (item.id)}
            {@const status = getReportLinkStatus(item)}
            <div class="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
              <span>
                {item.periodStart.slice(0, 10)} – {item.periodEnd.slice(0, 10)} · {$t('student_report.history.views', {
                  count: item.viewCount
                })}
              </span>
              <span class="flex items-center gap-2">
                <Badge variant={status === 'active' ? 'success' : 'outline'}
                  >{$t(`student_report.history.status.${status}`)}</Badge
                >
                {#if status === 'active'}
                  <Button size="sm" variant="outline" onclick={() => handleRevoke(item.id)} testId="report-revoke">
                    {$t('student_report.history.revoke')}
                  </Button>
                {/if}
              </span>
            </div>
          {/each}
        </div>
      {/if}

      <Dialog.Footer>
        <Button size="sm" variant="outline" onclick={() => (open = false)}>{$t('student_report.dialog.cancel')}</Button>
        <Button
          size="sm"
          onclick={handleSubmit}
          loading={studentReportApi.isLoading}
          disabled={$isFreePlan}
          testId="report-submit"
        >
          {$t('student_report.dialog.submit')}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
