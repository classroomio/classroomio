<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { Switch } from '@cio/ui/base/switch';
  import * as Alert from '@cio/ui/base/alert';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Page from '@cio/ui/base/page';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import PackageIcon from '@lucide/svelte/icons/package';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { activityApi, courseApi, packageApi } from '$features/course/api';
  import ActivityResultsPanel from '$features/course/components/activity/activity-results-panel.svelte';
  import LearnerAttemptsSheet from '$features/course/components/activity/learner-attempts-sheet.svelte';
  import PackageDetails from '$features/course/components/activity/package-details.svelte';
  import PackageSettings from '$features/course/components/activity/package-settings.svelte';
  import PackageUpload from '$features/course/components/activity/package-upload.svelte';
  import ActivityPlayer from '$features/course/components/activity/activity-player.svelte';
  import { unitPassMark } from '$features/course/utils/scorm-utils';
  import { currentOrg } from '$lib/utils/store/org';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { profile } from '$lib/utils/store/user';
  import { licenseApi } from '$features/license/api/license.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    activityId: string;
  }

  let { courseId, activityId }: Props = $props();

  let currentTab = $state('package');
  let replaceMode = $state<'upgrade' | 'swap' | null>(null);
  let deleteOpen = $state(false);
  let deleting = $state(false);
  let removeOpen = $state(false);
  let removing = $state(false);
  let swapOpen = $state(false);
  let moveStaleOpen = $state(false);
  let movingStale = $state(false);
  let loadedActivityId = $state('');
  let selectedLearnerId = $state<string | null>(null);
  let sheetOpen = $state(false);
  let title = $state('');
  let instructions = $state('');
  let savingTitle = $state(false);
  let savingInstructions = $state(false);

  const hasScormAccess = $derived(licenseApi.hasAccess('scorm'));
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  $effect(() => {
    const organizationId = $currentOrg.id;
    const profileId = $profile.id;
    if (!organizationId || !profileId || !courseId || !activityId) return;

    untrack(() => {
      void courseApi.refreshCourse(courseId, profileId);
      void activityApi.get(courseId, activityId);
    });
  });

  $effect(() => {
    if (activityId === loadedActivityId) return;

    loadedActivityId = activityId;
    replaceMode = null;
    deleteOpen = false;
    removeOpen = false;
    swapOpen = false;
    moveStaleOpen = false;
    currentTab = 'package';
    title = activityApi.activity?.title ?? '';
    instructions = (activityApi.activity?.instructions as string | null) ?? '';
  });

  const editorData = $derived(activityApi.editor);
  const scormEditor = $derived(editorData && editorData.available ? editorData : null);
  const attachedPackage = $derived(scormEditor?.package ?? null);
  const editorSettings = $derived(scormEditor?.settings ?? null);
  const attemptCounts = $derived(
    attachedPackage && 'attemptCounts' in attachedPackage
      ? (attachedPackage.attemptCounts as { inProgress: number; stale: number; staleVersionNumber: number | null })
      : null
  );
  const inProgressCount = $derived(attemptCounts?.inProgress ?? 0);
  const staleCount = $derived(attemptCounts?.stale ?? 0);
  const staleVersionNumber = $derived(attemptCounts?.staleVersionNumber ?? null);
  const currentFingerprint = $derived(
    attachedPackage
      ? {
          zipBytes: attachedPackage.currentVersion?.zipBytes ?? null,
          title: attachedPackage.asset.title ?? null,
          scoIds: (attachedPackage.units ?? [])
            .filter((unit) => unit.unitType === 'sco')
            .map((unit) => unit.identifier)
            .sort()
        }
      : null
  );

  const hasPassMark = $derived.by(() => {
    for (const unit of attachedPackage?.units ?? []) {
      if (unitPassMark(unit) !== null) return true;
    }
    return false;
  });

  const titleDirty = $derived(title.trim() !== (activityApi.activity?.title ?? '').trim());
  const instructionsDirty = $derived(instructions !== ((activityApi.activity?.instructions as string | null) ?? ''));

  async function saveTitle() {
    const next = title.trim();
    if (!next || !titleDirty || savingTitle) return;

    savingTitle = true;
    try {
      await activityApi.update(courseId, activityId, { title: next });
      if (activityApi.success) snackbar.success('snackbar.success_update');
    } finally {
      savingTitle = false;
    }
  }

  async function saveInstructions() {
    if (!instructionsDirty || savingInstructions) return;

    savingInstructions = true;
    try {
      await activityApi.update(courseId, activityId, { instructions });
      if (activityApi.success) snackbar.success('snackbar.activity.instructions_saved');
    } finally {
      savingInstructions = false;
    }
  }

  async function toggleLock(locked: boolean) {
    await activityApi.update(courseId, activityId, { isUnlocked: !locked });
    if (activityApi.success) void activityApi.get(courseId, activityId);
  }

  async function deleteActivity() {
    deleting = true;
    try {
      await activityApi.delete(courseId, activityId);
      if (activityApi.success) {
        const profileId = $profile.id;
        if (profileId) void courseApi.refreshCourse(courseId, profileId);
        await goto(resolve(`/courses/${courseId}/lessons`, {}));
      }
    } finally {
      deleting = false;
      deleteOpen = false;
    }
  }

  async function refreshEditor() {
    await activityApi.get(courseId, activityId);
    replaceMode = null;
    const profileId = $profile.id;
    if (profileId) void courseApi.refreshCourse(courseId, profileId);
  }

  async function refreshAttemptCounts(): Promise<number> {
    await activityApi.get(courseId, activityId);

    return inProgressCount;
  }

  async function confirmRemovePackage() {
    removing = true;
    try {
      await activityApi.detachPackage(courseId, activityId);
      if (!activityApi.success) return;
      removeOpen = false;
      void refreshEditor();
    } finally {
      removing = false;
    }
  }

  async function confirmMoveStale() {
    const assetId = attachedPackage?.asset.id;
    const versionId = attachedPackage?.currentVersion?.id;
    if (!assetId || !versionId) return;

    movingStale = true;
    try {
      await packageApi.makeCurrent(assetId, versionId, true);
      if (!packageApi.success) return;
      moveStaleOpen = false;
      void refreshEditor();
    } finally {
      movingStale = false;
    }
  }

  function handleRemoveRequest() {
    removeOpen = true;
  }

  function handleSwapRequest() {
    replaceMode = 'swap';
  }

  function handleRemoveOpenChange(isOpen: boolean) {
    removeOpen = isOpen;
  }

  function handleSwapOpenChange(isOpen: boolean) {
    swapOpen = isOpen;
  }

  function handleMoveStaleOpenChange(isOpen: boolean) {
    moveStaleOpen = isOpen;
  }

  function openLearnerSheet(profileId: string) {
    selectedLearnerId = profileId;
    sheetOpen = true;
  }

  const selectedLearnerName = $derived(
    (activityApi.results ?? []).find((learner) => learner.profileId === selectedLearnerId)?.fullname ?? null
  );

  async function handleLearnerReset() {
    await activityApi.listResults(courseId, activityId, {
      page: 1,
      limit: 20,
      sort: 'last_launched',
      direction: 'desc'
    });
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  <Page.Body>
    {#snippet child()}
      {#if $isCourseLearnerView}
        <ActivityPlayer {courseId} {activityId} />
      {:else}
        <div class="flex flex-wrap items-center gap-3">
          <InputField
            label={$t('course.navItem.lessons.add_content_options.activity_scorm_title_label')}
            bind:value={title}
            className="min-w-52 flex-1"
          />
          <Button size="sm" onclick={saveTitle} loading={savingTitle} disabled={!titleDirty}>
            {$t('common.save_changes')}
          </Button>
          <label class="flex items-center gap-2 text-sm">
            <Switch
              checked={!(activityApi.activity?.isUnlocked ?? true)}
              onCheckedChange={(checked) => void toggleLock(checked)}
            />
            {$t('course.navItem.lessons.activities.header_locked')}
          </label>
          <Button variant="outline" size="sm" onclick={() => (deleteOpen = true)}>
            <TrashIcon class="size-4" />
          </Button>
        </div>

        {#if !hasScormAccess}
          <Alert.Root variant="warning" class="mt-4">
            <Alert.Title>{$t('course.navItem.lessons.activities.gating.title')}</Alert.Title>
            <Alert.Description>
              {#if isSelfHosted}
                {$t('course.navItem.lessons.activities.gating.no_license')}
              {:else}
                {$t('course.navItem.lessons.activities.gating.plan_lapsed')}
              {/if}
            </Alert.Description>
            {#if !isSelfHosted}
              <div class="mt-3">
                <Button size="sm" variant="outline" onclick={openUpgradeModal}>
                  {$t('course.navItem.lessons.add_content_options.activity_scorm_upgrade_cta')}
                </Button>
              </div>
            {/if}
          </Alert.Root>
        {/if}

        <UnderlineTabs.Root bind:value={currentTab} class="mt-4">
          <UnderlineTabs.List>
            <UnderlineTabs.Trigger value="package">
              {$t('course.navItem.lessons.activities.tabs.package')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="instructions">
              {$t('course.navItem.lessons.activities.tabs.instructions')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="results">
              {$t('course.navItem.lessons.activities.tabs.results')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="settings">
              {$t('course.navItem.lessons.activities.tabs.settings')}
            </UnderlineTabs.Trigger>
          </UnderlineTabs.List>

          <UnderlineTabs.Content value="package">
            <div class="py-4">
              {#if !scormEditor}
                <Empty
                  title={$t('course.navItem.lessons.activities.not_available_title')}
                  description={$t('course.navItem.lessons.activities.not_available_description')}
                  icon={PackageIcon}
                  variant="page"
                />
              {:else if !attachedPackage || replaceMode}
                {#if replaceMode && attachedPackage}
                  <div class="mb-4 flex justify-end">
                    <Button variant="outline" size="sm" onclick={() => (replaceMode = null)}>
                      {$t('common.discard')}
                    </Button>
                  </div>
                {/if}
                <PackageUpload
                  {courseId}
                  {activityId}
                  assetId={attachedPackage?.asset.id ?? null}
                  mode={attachedPackage ? (replaceMode ?? 'upgrade') : 'attach'}
                  inProgressCount={attachedPackage ? inProgressCount : 0}
                  currentFingerprint={attachedPackage ? currentFingerprint : null}
                  getFreshInProgressCount={refreshAttemptCounts}
                  onAttached={refreshEditor}
                  onReplaced={refreshEditor}
                  onSwapRequest={handleSwapRequest}
                />
              {:else}
                {#if staleCount > 0}
                  <Alert.Root variant="warning" class="mb-4">
                    <Alert.Description>
                      {$t('course.navItem.lessons.activities.package.stale_banner', {
                        count: staleCount,
                        version: staleVersionNumber ?? 1
                      })}
                    </Alert.Description>
                    <div class="mt-3">
                      <Button size="sm" variant="outline" onclick={() => (moveStaleOpen = true)}>
                        {$t('course.navItem.lessons.activities.package.move_stale')}
                      </Button>
                    </div>
                  </Alert.Root>
                {/if}
                <PackageDetails
                  details={attachedPackage}
                  onUpgrade={() => (replaceMode = 'upgrade')}
                  onSwap={() => (swapOpen = true)}
                  onRemove={handleRemoveRequest}
                />
              {/if}
            </div>
          </UnderlineTabs.Content>

          <UnderlineTabs.Content value="instructions">
            <div class="space-y-4 py-4">
              <TextareaField
                label={$t('course.navItem.lessons.activities.instructions.label')}
                bind:value={instructions}
                rows={6}
                placeholder={$t('course.navItem.lessons.activities.instructions.placeholder')}
              />
              <div class="flex justify-end">
                <Button onclick={saveInstructions} loading={savingInstructions} disabled={!instructionsDirty}>
                  {$t('course.navItem.lessons.activities.instructions.save')}
                </Button>
              </div>
            </div>
          </UnderlineTabs.Content>

          <UnderlineTabs.Content value="results">
            <div class="py-4">
              <ActivityResultsPanel {courseId} {activityId} onSelectLearner={openLearnerSheet} />
            </div>
          </UnderlineTabs.Content>

          <UnderlineTabs.Content value="settings">
            <div class="py-4">
              {#if editorSettings}
                <PackageSettings
                  {courseId}
                  {activityId}
                  settings={editorSettings}
                  {hasPassMark}
                  disabled={!hasScormAccess}
                  onSaved={refreshEditor}
                />
              {/if}
            </div>
          </UnderlineTabs.Content>
        </UnderlineTabs.Root>

        <Dialog.Root bind:open={deleteOpen}>
          <Dialog.Content class="w-96 p-6">
            <Dialog.Header class="p-2">
              <Dialog.Title>{$t('course.navItem.lessons.activities.delete_confirm_title')}</Dialog.Title>
              <Dialog.Description>
                {$t('course.navItem.lessons.activities.delete_confirm_body')}
              </Dialog.Description>
            </Dialog.Header>
            <div class="mt-6 flex items-center justify-between">
              <Button variant="outline" onclick={() => (deleteOpen = false)} disabled={deleting}>
                {$t('delete_modal.no')}
              </Button>
              <Button variant="destructive" onclick={deleteActivity} loading={deleting}>
                {$t('delete_modal.yes')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>

        <Dialog.Root open={swapOpen} onOpenChange={handleSwapOpenChange}>
          <Dialog.Content class="w-96 p-6">
            <Dialog.Header class="p-2">
              <Dialog.Title>{$t('course.navItem.lessons.activities.package.swap_confirm_title')}</Dialog.Title>
              <Dialog.Description>
                {#if inProgressCount > 0}
                  {$t('course.navItem.lessons.activities.package.swap_confirm_body_with_count', {
                    count: inProgressCount
                  })}
                {:else}
                  {$t('course.navItem.lessons.activities.package.swap_confirm_body')}
                {/if}
              </Dialog.Description>
            </Dialog.Header>
            <div class="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" onclick={() => (swapOpen = false)}>
                {$t('delete_modal.no')}
              </Button>
              <Button
                size="sm"
                onclick={() => {
                  swapOpen = false;
                  replaceMode = 'swap';
                }}
              >
                {$t('course.navItem.lessons.activities.package.swap_package')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>

        <Dialog.Root open={removeOpen} onOpenChange={handleRemoveOpenChange}>
          <Dialog.Content class="w-96 p-6">
            <Dialog.Header class="p-2">
              <Dialog.Title>{$t('course.navItem.lessons.activities.package.remove_confirm_title')}</Dialog.Title>
              <Dialog.Description>
                {#if inProgressCount > 0}
                  {$t('course.navItem.lessons.activities.package.remove_confirm_body_with_count', {
                    count: inProgressCount
                  })}
                {:else}
                  {$t('course.navItem.lessons.activities.package.remove_confirm_body')}
                {/if}
              </Dialog.Description>
            </Dialog.Header>
            <div class="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" onclick={() => (removeOpen = false)} disabled={removing}>
                {$t('delete_modal.no')}
              </Button>
              <Button variant="destructive" size="sm" onclick={confirmRemovePackage} loading={removing}>
                {$t('delete_modal.yes')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>

        <Dialog.Root open={moveStaleOpen} onOpenChange={handleMoveStaleOpenChange}>
          <Dialog.Content class="w-96 p-6">
            <Dialog.Header class="p-2">
              <Dialog.Title>{$t('course.navItem.lessons.activities.package.move_stale_confirm_title')}</Dialog.Title>
              <Dialog.Description>
                {$t('course.navItem.lessons.activities.package.move_stale_confirm_body', { count: staleCount })}
              </Dialog.Description>
            </Dialog.Header>
            <div class="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" onclick={() => (moveStaleOpen = false)} disabled={movingStale}>
                {$t('delete_modal.no')}
              </Button>
              <Button size="sm" onclick={confirmMoveStale} loading={movingStale}>
                {$t('course.navItem.lessons.activities.package.move_stale')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>

        <LearnerAttemptsSheet
          {courseId}
          {activityId}
          profileId={selectedLearnerId}
          learnerName={selectedLearnerName}
          bind:open={sheetOpen}
          onReset={handleLearnerReset}
        />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
