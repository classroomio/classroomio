<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Field from '@cio/ui/base/field';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Table from '@cio/ui/base/table';
  import * as Tabs from '@cio/ui/base/tabs';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import { complianceApi, courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import type { CourseComplianceLearner, LearnerComplianceRecord } from '$features/course/utils/types';
  import { snackbar } from '$features/ui/snackbar/store';
  import { SvelteSet } from 'svelte/reactivity';

  type ComplianceStatus = CourseComplianceLearner['status'] | LearnerComplianceRecord['status'] | 'no_record';
  type StaffAction = 'reset' | 'extend' | 'waive' | null;

  let lastRequestKey = $state<string | null>(null);
  let staffTab = $state<'overview' | 'learners'>('overview');
  let activeAction = $state<StaffAction>(null);
  let bulkActionType = $state<Exclude<StaffAction, null> | null>(null);
  let isBulkActionModalOpen = $state(false);
  let actionFields = $state({
    dueDate: '',
    waiverReason: '',
    waiverExpiresAt: ''
  });

  let selectedLearnerIds = new SvelteSet<string>();

  const currentMember = $derived(courseApi.group.people.find((person) => person.profileId === $profile.id));
  const currentRoleId = $derived(currentMember ? Number(currentMember.roleId) : null);
  const isComplianceCourse = $derived(courseApi.course?.type === 'COMPLIANCE');
  const isStudent = $derived(currentRoleId === 3);
  const overview = $derived(complianceApi.overview);
  const learnerHistory = $derived(complianceApi.learnerHistory);
  const historyRecords = $derived(learnerHistory?.history ?? []);
  const currentRecord = $derived(learnerHistory?.currentRecord ?? null);
  const learnerRows = $derived(overview?.learners ?? []);
  const selectedProfileIds = $derived(Array.from(selectedLearnerIds));
  const allVisibleSelected = $derived(
    learnerRows.length > 0 &&
      learnerRows.every((learner) => (learner.profileId ? selectedLearnerIds.has(learner.profileId) : false))
  );
  const someVisibleSelected = $derived(
    learnerRows.some((learner) => learner.profileId && selectedLearnerIds.has(learner.profileId))
  );
  const summaryCards = $derived.by(() => {
    if (!overview) {
      return [];
    }

    return [
      { labelKey: 'course.navItem.compliance.summary.total_learners', value: overview.summary.totalLearners },
      { labelKey: 'course.navItem.compliance.summary.no_record', value: overview.summary.noRecord },
      { labelKey: 'course.navItem.compliance.summary.not_started', value: overview.summary.notStarted },
      { labelKey: 'course.navItem.compliance.summary.in_progress', value: overview.summary.inProgress },
      { labelKey: 'course.navItem.compliance.summary.compliant', value: overview.summary.compliant },
      { labelKey: 'course.navItem.compliance.summary.expiring_soon', value: overview.summary.expiringSoon },
      { labelKey: 'course.navItem.compliance.summary.in_grace_period', value: overview.summary.inGracePeriod },
      { labelKey: 'course.navItem.compliance.summary.non_compliant', value: overview.summary.nonCompliant },
      { labelKey: 'course.navItem.compliance.summary.waived', value: overview.summary.waived }
    ];
  });

  $effect(() => {
    if (!courseApi.course?.id) {
      return;
    }

    if (!isComplianceCourse) {
      complianceApi.reset();
      lastRequestKey = null;
      return;
    }

    const courseId = courseApi.course.id;
    if (isStudent && currentMember?.profileId) {
      const requestKey = `${courseId}:${currentMember.profileId}:learner`;
      if (lastRequestKey === requestKey) {
        return;
      }

      lastRequestKey = requestKey;
      void complianceApi.ensureLearnerHistory(courseId, currentMember.profileId);
      return;
    }

    const requestKey = `${courseId}:overview`;
    if (lastRequestKey === requestKey) {
      return;
    }

    lastRequestKey = requestKey;
    void complianceApi.ensureOverview(courseId);
  });

  $effect(() => {
    const deadline = courseApi.course?.certificate?.deadline;
    if (!deadline || actionFields.dueDate) {
      return;
    }

    const localDeadline = toLocalDateTimeInput(deadline);
    if (!localDeadline) {
      return;
    }

    actionFields.dueDate = localDeadline;
  });

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return t.get('course.navItem.compliance.not_available');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t.get('course.navItem.compliance.not_available');
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  function formatPercent(value: number | null | undefined) {
    if (typeof value !== 'number') {
      return t.get('course.navItem.compliance.not_available');
    }

    return `${value}%`;
  }

  function formatCount(value: number | null | undefined) {
    if (typeof value !== 'number') {
      return t.get('course.navItem.compliance.not_available');
    }

    return `${value}`;
  }

  function toLocalDateTimeInput(value: string | null | undefined) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const timezoneOffsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - timezoneOffsetMilliseconds).toISOString().slice(0, 16);
  }

  function toIsoDateTime(value: string) {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  function getStatusLabelKey(status: ComplianceStatus) {
    return `course.navItem.compliance.status.${status}`;
  }

  function getStatusVariant(status: ComplianceStatus) {
    if (status === 'compliant') {
      return 'success';
    }

    if (status === 'expiring_soon' || status === 'in_progress' || status === 'in_grace_period') {
      return 'warning';
    }

    if (status === 'non_compliant') {
      return 'destructive';
    }

    if (status === 'waived') {
      return 'secondary';
    }

    return 'outline';
  }

  function toggleLearner(profileId: string) {
    if (selectedLearnerIds.has(profileId)) {
      selectedLearnerIds.delete(profileId);
      return;
    }

    selectedLearnerIds.add(profileId);
  }

  function toggleAllVisibleLearners() {
    if (allVisibleSelected) {
      for (const learner of learnerRows) {
        if (!learner.profileId) {
          continue;
        }

        selectedLearnerIds.delete(learner.profileId);
      }

      return;
    }

    for (const learner of learnerRows) {
      if (!learner.profileId) {
        continue;
      }

      selectedLearnerIds.add(learner.profileId);
    }
  }

  function clearSelection() {
    selectedLearnerIds.clear();
  }

  function resetActionFields() {
    actionFields.dueDate = '';
    actionFields.waiverReason = '';
    actionFields.waiverExpiresAt = '';
  }

  function openBulkActionModal(action: Exclude<StaffAction, null>) {
    bulkActionType = action;
    complianceApi.resetErrors();
    isBulkActionModalOpen = true;
  }

  function handleBulkActionModalChange(isOpen: boolean) {
    isBulkActionModalOpen = isOpen;

    if (isOpen) {
      return;
    }

    bulkActionType = null;
    complianceApi.resetErrors();
    resetActionFields();
  }

  function closeBulkActionModal() {
    handleBulkActionModalChange(false);
  }

  function getBulkActionTitle() {
    if (bulkActionType === 'reset') {
      return t.get('course.navItem.compliance.bulk_actions.reset_action');
    }

    if (bulkActionType === 'extend') {
      return t.get('course.navItem.compliance.bulk_actions.extend_action');
    }

    if (bulkActionType === 'waive') {
      return t.get('course.navItem.compliance.bulk_actions.waive_action');
    }

    return t.get('course.navItem.compliance.bulk_actions.title');
  }

  async function handleReset() {
    const courseId = courseApi.course?.id;
    const dueDate = toIsoDateTime(actionFields.dueDate);
    if (!courseId || selectedProfileIds.length === 0 || !dueDate) {
      snackbar.error('snackbar.course.compliance.reset_failed');
      return;
    }

    activeAction = 'reset';
    const response = await complianceApi.resetCourseCompliance(courseId, {
      profileIds: selectedProfileIds,
      dueDate
    });
    activeAction = null;

    if (!response) {
      return;
    }

    clearSelection();
    closeBulkActionModal();
    resetActionFields();
  }

  async function handleExtend() {
    const courseId = courseApi.course?.id;
    const dueDate = toIsoDateTime(actionFields.dueDate);
    if (!courseId || selectedProfileIds.length === 0 || !dueDate) {
      snackbar.error('snackbar.course.compliance.extend_failed');
      return;
    }

    activeAction = 'extend';
    const response = await complianceApi.extendCourseCompliance(courseId, {
      profileIds: selectedProfileIds,
      dueDate
    });
    activeAction = null;

    if (!response) {
      return;
    }

    clearSelection();
    closeBulkActionModal();
    resetActionFields();
  }

  async function handleWaive() {
    const courseId = courseApi.course?.id;
    if (!courseId || selectedProfileIds.length === 0) {
      snackbar.error('snackbar.course.compliance.waive_failed');
      return;
    }

    activeAction = 'waive';
    const response = await complianceApi.waiveCourseCompliance(courseId, {
      profileIds: selectedProfileIds,
      waiverReason: actionFields.waiverReason.trim() || undefined,
      waiverExpiresAt: toIsoDateTime(actionFields.waiverExpiresAt) ?? undefined
    });
    activeAction = null;

    if (!response) {
      return;
    }

    clearSelection();
    closeBulkActionModal();
    resetActionFields();
  }
</script>

{#if !isComplianceCourse}
  <Empty
    title={$t('course.navItem.compliance.not_compliance_title')}
    description={$t('course.navItem.compliance.not_compliance_description')}
    icon={ShieldCheckIcon}
    variant="page"
  />
{:else if complianceApi.isLoading && !overview && !learnerHistory}
  <Empty title={$t('course.navItem.compliance.loading')} icon={ShieldCheckIcon} variant="page" />
{:else if isStudent}
  <Field.Group class="space-y-8">
    <Field.Set class="gap-4!">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <Field.Legend>{$t('course.navItem.compliance.current_cycle')}</Field.Legend>
          <Field.Description>{$t('course.navItem.compliance.current_cycle_description')}</Field.Description>
        </div>
        {#if currentRecord}
          <Badge variant={getStatusVariant(currentRecord.status)}>
            {$t(getStatusLabelKey(currentRecord.status))}
          </Badge>
        {/if}
      </div>

      {#if currentRecord}
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">
              {$t('course.navItem.compliance.fields.cycle')}
            </p>
            <p class="mt-2 text-lg font-semibold">{currentRecord.cycleNumber}</p>
          </div>
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">
              {$t('course.navItem.compliance.fields.due_date')}
            </p>
            <p class="mt-2 text-lg font-semibold">{formatDate(currentRecord.dueDate)}</p>
          </div>
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">
              {$t('course.navItem.compliance.fields.completed_at')}
            </p>
            <p class="mt-2 text-lg font-semibold">{formatDate(currentRecord.completedAt)}</p>
          </div>
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">
              {$t('course.navItem.compliance.fields.valid_until')}
            </p>
            <p class="mt-2 text-lg font-semibold">{formatDate(currentRecord.validUntil)}</p>
          </div>
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">
              {$t('course.navItem.compliance.fields.score')}
            </p>
            <p class="mt-2 text-lg font-semibold">{formatPercent(currentRecord.score)}</p>
          </div>
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">
              {$t('course.navItem.compliance.fields.attempts')}
            </p>
            <p class="mt-2 text-lg font-semibold">{formatCount(currentRecord.attempts)}</p>
          </div>
        </div>
      {:else}
        <Empty
          title={$t('course.navItem.compliance.no_active_cycle')}
          description={$t('course.navItem.compliance.empty_history')}
          icon={ShieldCheckIcon}
          variant="page"
        />
      {/if}
    </Field.Set>

    <Field.Separator />

    <Field.Set class="gap-4!">
      <Field.Legend>{$t('course.navItem.compliance.history')}</Field.Legend>
      <Field.Description>{$t('course.navItem.compliance.history_description')}</Field.Description>

      {#if historyRecords.length > 0}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>{$t('course.navItem.compliance.fields.cycle')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.status')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.due_date')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.completed_at')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.valid_until')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.score')}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each historyRecords as record}
              <Table.Row>
                <Table.Cell>{record.cycleNumber}</Table.Cell>
                <Table.Cell>
                  <Badge variant={getStatusVariant(record.status)}>
                    {$t(getStatusLabelKey(record.status))}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{formatDate(record.dueDate)}</Table.Cell>
                <Table.Cell>{formatDate(record.completedAt)}</Table.Cell>
                <Table.Cell>{formatDate(record.validUntil)}</Table.Cell>
                <Table.Cell>{formatPercent(record.score)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {:else}
        <Empty title={$t('course.navItem.compliance.empty_history')} icon={ShieldCheckIcon} variant="page" />
      {/if}
    </Field.Set>
  </Field.Group>
{:else if overview}
  <Tabs.Root bind:value={staffTab} class="w-full">
    <Tabs.List class="inline-flex w-auto">
      <Tabs.Trigger value="overview">{$t('course.navItem.compliance.tabs.overview')}</Tabs.Trigger>
      <Tabs.Trigger value="learners">{$t('course.navItem.compliance.tabs.learners')}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="overview" class="mt-4">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {#each summaryCards as card}
          <div class="ui:bg-muted/40 rounded-lg p-4">
            <p class="ui:text-muted-foreground text-xs tracking-wide uppercase">{$t(card.labelKey)}</p>
            <p class="mt-2 text-lg font-semibold">{card.value}</p>
          </div>
        {/each}
      </div>
    </Tabs.Content>

    <Tabs.Content value="learners" class="mt-4 space-y-4">
      <div class="ui:bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <Checkbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onclick={toggleAllVisibleLearners}
            />
            <span class="text-sm font-medium">{$t('course.navItem.compliance.bulk_actions.select_all')}</span>
          </div>

          <Badge variant="outline">
            {$t('course.navItem.compliance.bulk_actions.selected_count', { count: selectedProfileIds.length })}
          </Badge>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button variant="outline" onclick={clearSelection} disabled={selectedProfileIds.length === 0}>
            {$t('course.navItem.compliance.bulk_actions.clear_selection')}
          </Button>
          <Button
            variant="outline"
            onclick={() => openBulkActionModal('reset')}
            disabled={selectedProfileIds.length === 0}
          >
            {$t('course.navItem.compliance.bulk_actions.reset_action')}
          </Button>
          <Button
            variant="outline"
            onclick={() => openBulkActionModal('extend')}
            disabled={selectedProfileIds.length === 0}
          >
            {$t('course.navItem.compliance.bulk_actions.extend_action')}
          </Button>
          <Button
            variant="outline"
            onclick={() => openBulkActionModal('waive')}
            disabled={selectedProfileIds.length === 0}
          >
            {$t('course.navItem.compliance.bulk_actions.waive_action')}
          </Button>
        </div>
      </div>

      {#if learnerRows.length > 0}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="w-12">
                <span class="sr-only">{$t('course.navItem.compliance.bulk_actions.select_all')}</span>
              </Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.learner')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.email')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.status')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.due_date')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.valid_until')}</Table.Head>
              <Table.Head>{$t('course.navItem.compliance.fields.score')}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each learnerRows as learner}
              <Table.Row>
                <Table.Cell>
                  {#if learner.profileId}
                    <Checkbox
                      checked={selectedLearnerIds.has(learner.profileId)}
                      onclick={() => toggleLearner(learner.profileId!)}
                    />
                  {/if}
                </Table.Cell>
                <Table.Cell
                  >{learner.fullname || learner.username || $t('course.navItem.compliance.not_available')}</Table.Cell
                >
                <Table.Cell>{learner.email || $t('course.navItem.compliance.not_available')}</Table.Cell>
                <Table.Cell>
                  <Badge variant={getStatusVariant(learner.status ?? 'no_record')}>
                    {$t(getStatusLabelKey(learner.status ?? 'no_record'))}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{formatDate(learner.dueDate)}</Table.Cell>
                <Table.Cell>{formatDate(learner.validUntil)}</Table.Cell>
                <Table.Cell>{formatPercent(learner.score)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {:else}
        <Empty title={$t('course.navItem.compliance.empty_overview')} icon={ShieldCheckIcon} variant="page" />
      {/if}
    </Tabs.Content>
  </Tabs.Root>
{:else}
  <Empty title={$t('course.navItem.compliance.empty_overview')} icon={ShieldCheckIcon} variant="page" />
{/if}

<Dialog.Root bind:open={isBulkActionModalOpen} onOpenChange={handleBulkActionModalChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{getBulkActionTitle()}</Dialog.Title>
      <Dialog.Description>
        {$t('course.navItem.compliance.bulk_actions.modal.description', { count: selectedProfileIds.length })}
      </Dialog.Description>
    </Dialog.Header>

    <div class="py-2">
      {#if bulkActionType === 'reset' || bulkActionType === 'extend'}
        <InputField
          label={$t('course.navItem.compliance.bulk_actions.due_date_label')}
          type="datetime-local"
          bind:value={actionFields.dueDate}
          helperMessage={$t('course.navItem.compliance.bulk_actions.due_date_helper')}
          errorMessage={complianceApi.errors.dueDate}
          autoFocus
        />
      {/if}

      {#if bulkActionType === 'waive'}
        <div class="space-y-4">
          <TextareaField
            label={$t('course.navItem.compliance.bulk_actions.waiver_reason_label')}
            bind:value={actionFields.waiverReason}
            helperMessage={$t('course.navItem.compliance.bulk_actions.waiver_reason_helper')}
            errorMessage={complianceApi.errors.waiverReason}
            autoFocus
          />

          <InputField
            label={$t('course.navItem.compliance.bulk_actions.waiver_expires_at_label')}
            type="datetime-local"
            bind:value={actionFields.waiverExpiresAt}
            helperMessage={$t('course.navItem.compliance.bulk_actions.waiver_expires_at_helper')}
            errorMessage={complianceApi.errors.waiverExpiresAt}
          />
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={closeBulkActionModal}>
        {$t('course.navItem.compliance.bulk_actions.modal.cancel')}
      </Button>

      {#if bulkActionType === 'reset'}
        <Button onclick={handleReset} loading={activeAction === 'reset'} disabled={complianceApi.isLoading}>
          {$t('course.navItem.compliance.bulk_actions.modal.apply')}
        </Button>
      {:else if bulkActionType === 'extend'}
        <Button onclick={handleExtend} loading={activeAction === 'extend'} disabled={complianceApi.isLoading}>
          {$t('course.navItem.compliance.bulk_actions.modal.apply')}
        </Button>
      {:else if bulkActionType === 'waive'}
        <Button onclick={handleWaive} loading={activeAction === 'waive'} disabled={complianceApi.isLoading}>
          {$t('course.navItem.compliance.bulk_actions.modal.apply')}
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
