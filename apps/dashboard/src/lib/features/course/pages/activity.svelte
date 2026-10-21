<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { onDestroy, untrack } from 'svelte';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Alert from '@cio/ui/base/alert';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Page from '@cio/ui/base/page';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { RefreshPageData, RoleBasedSecurity, UnsavedChanges } from '$features/ui';
  import PackageIcon from '@lucide/svelte/icons/package';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import AwardIcon from '@lucide/svelte/icons/award';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Save from '@lucide/svelte/icons/save';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { activityApi, courseApi, packageApi } from '$features/course/api';
  import ActivityResultsPanel from '$features/course/components/activity/activity-results-panel.svelte';
  import LearnerAttemptsSheet from '$features/course/components/activity/learner-attempts-sheet.svelte';
  import PackageDetails from '$features/course/components/activity/package-details.svelte';
  import PackageSettings from '$features/course/components/activity/package-settings.svelte';
  import AddPackageModal from '$features/course/components/activity/add-package-modal.svelte';
  import ActivityPlayer from '$features/course/components/activity/activity-player.svelte';
  import ActivityPageEditHeader from '$features/course/components/activity/activity-page-edit-header.svelte';
  import ActivityVersionHistory from '$features/course/components/activity/activity-version-history.svelte';
  import { ContentNavigationActions } from '$features/course/components/lesson';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import { getActivityStatusPill, unitPassMark } from '$features/course/utils/scorm-utils';
  import { getOrderedNavigableContent, getCourseProgress } from '$features/course/utils/content';
  import { isCourseMobileBottomNavVisible } from '$features/course/utils/mobile-bottom-nav';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import type { PackageFingerprint, PackageDetails as PackageDetailsType } from '$features/course/utils/types';
  import { ContentType } from '@cio/utils/constants/content';
  import MODES from '$lib/utils/constants/mode';
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

  const mode = $derived(page.url.searchParams.get('mode') === 'edit' ? MODES.edit : MODES.view);

  const showMobileBottomNav = $derived(
    isCourseMobileBottomNavVisible({
      isCourseLearnerView: $isCourseLearnerView,
      isMobile: isMobileStore.current,
      isContentPage: true,
      courseProgress: getCourseProgress(courseApi.course)
    })
  );

  let currentTab = $state('package');
  let addPackageModalOpen = $state(false);
  let addPackageModalMode = $state<'attach' | 'upgrade' | 'swap'>('attach');
  let settingsDirty = $state(false);
  let settingsSaving = $state(false);
  let settingsPanel = $state<PackageSettings | null>(null);
  let deleteOpen = $state(false);
  let deleting = $state(false);
  let removeOpen = $state(false);
  let removing = $state(false);
  let swapOpen = $state(false);
  let moveStaleOpen = $state(false);
  let movingStale = $state(false);
  let revertOpen = $state(false);
  let reverting = $state(false);
  let revertTargetVersion = $state<NonNullable<PackageDetailsType['versions']>[number] | null>(null);
  let revertCloseOpenAttempts = $state(false);
  let loadedActivityId = $state('');
  let syncedActivityId = $state<string | null>(null);
  let selectedLearnerId = $state<string | null>(null);
  let sheetOpen = $state(false);
  let title = $state('');
  let instructions = $state('');
  let savingTitle = $state(false);
  let savingInstructions = $state(false);
  let hasUnsavedChanges = $state(false);
  let resultsRefreshKey = $state(0);

  const HISTORY_PARAM = 'history';
  const VERSION_PARAM = 'version';

  const isVersionDrawerOpen = $derived(page.url.searchParams.get(HISTORY_PARAM) === 'open');

  const hasScormAccess = $derived(licenseApi.hasAccess('scorm'));
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';

  const currentNavigableItem = $derived(
    getOrderedNavigableContent(courseApi.course).find(
      (item) => item.type === ContentType.Activity && item.id === activityId
    )
  );

  const launch = $derived(activityApi.launchResult);
  const availableLaunch = $derived(launch && launch.available ? launch : null);
  const isActivityComplete = $derived(currentNavigableItem?.isComplete ?? false);
  const statusPill = $derived(
    getActivityStatusPill({
      launch: availableLaunch,
      isComplete: isActivityComplete
    })
  );

  const editorData = $derived(activityApi.editor);
  const scormEditor = $derived(editorData && editorData.available ? editorData : null);
  const attachedPackage = $derived(scormEditor?.package ?? null);
  const editorSettings = $derived(scormEditor?.settings ?? null);

  const displayTitle = $derived(
    currentNavigableItem?.title ||
      activityApi.activity?.title ||
      attachedPackage?.currentVersion?.title ||
      t.get('course.navItem.lessons.add_content_options.activity_scorm_default_title')
  );

  $effect(() => {
    const organizationId = $currentOrg.id;
    const profileId = $profile.id;
    if (!organizationId || !profileId || !courseId || !activityId) return;

    untrack(() => {
      if (courseApi.course?.id !== courseId) {
        void courseApi.refreshCourse(courseId, profileId);
      }
      if (activityApi.activity?.id !== activityId) {
        void activityApi.get(courseId, activityId);
      }
    });
  });

  $effect(() => {
    if (activityId !== loadedActivityId) {
      loadedActivityId = activityId;
      activityApi.launchResult = null;
      syncedActivityId = null;
      addPackageModalOpen = false;
      addPackageModalMode = 'attach';
      deleteOpen = false;
      removeOpen = false;
      swapOpen = false;
      moveStaleOpen = false;
      revertOpen = false;
      revertTargetVersion = null;
      currentTab = 'package';
      const navItem = currentNavigableItem;
      title = navItem?.id === activityId ? (navItem.title ?? '') : '';
      instructions = '';
    }

    const currentActivity = activityApi.activity;
    if (currentActivity && currentActivity.id === activityId && syncedActivityId !== activityId) {
      syncedActivityId = activityId;
      title = currentActivity.title ?? '';
      instructions = (currentActivity.instructions as string | null) ?? '';
    }
  });

  const attemptCounts = $derived(
    attachedPackage && 'attemptCounts' in attachedPackage
      ? (attachedPackage.attemptCounts as {
          inProgress: number;
          stale: number;
          staleVersionNumber: number | null;
          orphaned: number;
        })
      : null
  );
  const inProgressCount = $derived(attemptCounts?.inProgress ?? 0);
  const affectedCount = $derived(inProgressCount + (attemptCounts?.orphaned ?? 0));
  const staleCount = $derived(attemptCounts?.stale ?? 0);
  const staleVersionNumber = $derived(attemptCounts?.staleVersionNumber ?? null);
  const currentFingerprint = $derived<PackageFingerprint | null>(
    attachedPackage
      ? {
          contentSha256: attachedPackage.currentVersion?.contentSha256 ?? null,
          zipBytes: attachedPackage.currentVersion?.zipBytes ?? null,
          manifestIdentifier: attachedPackage.currentVersion?.manifestIdentifier ?? null,
          title: attachedPackage.currentVersion?.title ?? null,
          itemIds: (attachedPackage.units ?? []).map((unit) => unit.identifier).sort()
        }
      : null
  );

  const hasPassMark = $derived.by(() => {
    for (const unit of attachedPackage?.units ?? []) {
      if (unitPassMark(unit) !== null) return true;
    }
    return false;
  });

  const passMark = $derived.by(() => {
    for (const unit of attachedPackage?.units ?? []) {
      const mark = unitPassMark(unit);
      if (mark !== null) return mark;
    }
    return null;
  });

  const titleDirty = $derived(
    syncedActivityId === activityId && title.trim() !== (activityApi.activity?.title ?? '').trim()
  );
  const instructionsDirty = $derived(
    syncedActivityId === activityId && instructions !== ((activityApi.activity?.instructions as string | null) ?? '')
  );

  $effect(() => {
    hasUnsavedChanges = (titleDirty || instructionsDirty || settingsDirty) && mode === MODES.edit;
  });

  let saveDebounceTimeout: ReturnType<typeof setTimeout> | undefined;

  function clearAutoSave() {
    if (!saveDebounceTimeout) return;

    clearTimeout(saveDebounceTimeout);
    saveDebounceTimeout = undefined;
  }

  onDestroy(clearAutoSave);

  function triggerAutoSave() {
    if (mode === MODES.view) return;
    if (!titleDirty && !instructionsDirty) return;

    clearAutoSave();

    untrack(() => {
      saveDebounceTimeout = setTimeout(() => {
        saveDebounceTimeout = undefined;
        void saveAll();
      }, 2000);
    });
  }

  async function saveTitle() {
    const next = title.trim();
    if (!titleDirty || savingTitle) return;

    savingTitle = true;
    let saved = false;
    try {
      await activityApi.update(courseId, activityId, { title: next });
      saved = activityApi.success;
      if (saved) {
        courseApi.updateContentItem(activityId, ContentType.Activity, { title: next });
      }
    } finally {
      savingTitle = false;
    }
    if (saved && titleDirty) triggerAutoSave();
  }

  async function saveInstructions() {
    if (!instructionsDirty || savingInstructions) return;

    savingInstructions = true;
    const submitted = instructions;
    let saved = false;
    try {
      await activityApi.update(courseId, activityId, { instructions: submitted });
      saved = activityApi.success;
      if (saved && instructions === submitted) {
        instructions = (activityApi.activity?.instructions as string | null) ?? '';
      }
    } finally {
      savingInstructions = false;
    }
    if (saved && instructionsDirty) triggerAutoSave();
  }

  async function saveAll() {
    if (titleDirty && !savingTitle) await saveTitle();
    if (instructionsDirty && !savingInstructions) await saveInstructions();
    if (settingsDirty && settingsPanel) await settingsPanel.save();
  }

  function handleTitleChange(value: string) {
    title = value;
    triggerAutoSave();
  }

  function handleInstructionsChange(value: string) {
    instructions = value;
    triggerAutoSave();
  }

  function setModeQueryParam(value: (typeof MODES)[keyof typeof MODES]) {
    const params = new SvelteURLSearchParams(page.url.searchParams);
    params.set('mode', value);
    hasUnsavedChanges = false;
    void goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: false });
  }

  async function setHistoryQueryParam(isOpen: boolean) {
    const params = new SvelteURLSearchParams(page.url.searchParams);

    if (isOpen) {
      params.set(HISTORY_PARAM, 'open');
    } else {
      params.delete(HISTORY_PARAM);
      params.delete(VERSION_PARAM);
    }

    const query = params.toString();
    hasUnsavedChanges = false;
    await goto(resolve(query ? `${page.url.pathname}?${query}` : page.url.pathname, {}), { replaceState: false });
    hasUnsavedChanges = mode === MODES.edit && (titleDirty || instructionsDirty || settingsDirty);
  }

  function toggleMode() {
    if (mode === MODES.edit && hasUnsavedChanges) {
      clearAutoSave();
      void saveAll();
    }
    setModeQueryParam(mode === MODES.edit ? MODES.view : MODES.edit);
  }

  function saveSettings() {
    void settingsPanel?.save();
  }

  function discardSettings() {
    settingsPanel?.discard();
  }

  function abandonPendingEdits() {
    clearAutoSave();
    settingsPanel?.discard();
  }

  async function handleToggleLock() {
    const currentUnlocked = activityApi.activity?.isUnlocked ?? true;
    const nextUnlocked = !currentUnlocked;
    await activityApi.update(courseId, activityId, { isUnlocked: nextUnlocked });
    if (activityApi.success) {
      if (activityApi.activity) {
        activityApi.activity.isUnlocked = nextUnlocked;
      }
      courseApi.updateContentItem(activityId, ContentType.Activity, { isUnlocked: nextUnlocked });
    }
  }

  async function deleteActivity() {
    deleting = true;
    try {
      await activityApi.delete(courseId, activityId);
      if (activityApi.success) {
        hasUnsavedChanges = false;
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
    addPackageModalOpen = false;
    const currentActivity = activityApi.activity;
    if (currentActivity?.id === activityId) {
      const freshTitle = currentActivity.title ?? '';
      const normalizedTitle = title.trim().toLowerCase();
      const localizedDefault = t
        .get('course.navItem.lessons.add_content_options.activity_scorm_default_title')
        .trim()
        .toLowerCase();
      const isUnnamed = !normalizedTitle || normalizedTitle === 'scorm package' || normalizedTitle === localizedDefault;
      if (isUnnamed && freshTitle) {
        title = freshTitle;
        courseApi.updateContentItem(activityId, ContentType.Activity, { title: freshTitle });
      }
    }
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
      await packageApi.makeCurrent(assetId, versionId, true, activityId);
      if (!packageApi.success) return;
      moveStaleOpen = false;
      void refreshEditor();
    } finally {
      movingStale = false;
    }
  }

  function openAddPackageModal(nextMode: 'attach' | 'upgrade' | 'swap' = 'attach') {
    addPackageModalMode = nextMode;
    addPackageModalOpen = true;
  }

  function handleRemoveRequest() {
    currentTab = 'package';
    removeOpen = true;
  }

  function handleSwapRequest() {
    currentTab = 'package';
    openAddPackageModal('swap');
  }

  function handleUpgradeRequest() {
    currentTab = 'package';
    openAddPackageModal('upgrade');
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

  function handleRevertRequest(version: NonNullable<PackageDetailsType['versions']>[number]) {
    currentTab = 'package';
    revertTargetVersion = version;
    revertCloseOpenAttempts = false;
    revertOpen = true;
  }

  function handleRevertOpenChange(isOpen: boolean) {
    revertOpen = isOpen;
    if (!isOpen) {
      revertTargetVersion = null;
    }
  }

  async function confirmRevertVersion() {
    const assetId = attachedPackage?.asset.id;
    if (!assetId || !revertTargetVersion) return;

    reverting = true;
    try {
      await packageApi.makeCurrent(assetId, revertTargetVersion.id, revertCloseOpenAttempts, activityId);
      if (!packageApi.success) return;
      revertOpen = false;
      revertTargetVersion = null;
      await setHistoryQueryParam(false);
      void refreshEditor();
      snackbar.success('snackbar.lessons.success.version_restored');
    } finally {
      reverting = false;
    }
  }

  function openLearnerSheet(profileId: string) {
    selectedLearnerId = profileId;
    sheetOpen = true;
  }

  const selectedLearnerName = $derived(
    (activityApi.results ?? []).find((learner) => learner.profileId === selectedLearnerId)?.fullname ?? null
  );

  async function handleLearnerReset() {
    resultsRefreshKey += 1;
  }
</script>

<Page.Header>
  <Page.HeaderContent>
    <ActivityPageEditHeader
      {mode}
      title={mode === MODES.edit ? title : displayTitle}
      isUnlocked={activityApi.activity?.isUnlocked ?? true}
      isDeletingActivity={deleting}
      onTitleChange={handleTitleChange}
      onToggleLock={handleToggleLock}
      onRequestDelete={() => (deleteOpen = true)}
    />
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex items-center gap-2">
      {#if mode === MODES.view && $isCourseLearnerView}
        {#if statusPill}
          <Badge variant={statusPill.variant}>{$t(statusPill.label)}</Badge>
        {/if}
        <ContentNavigationActions {activityId} {courseId} showPrevNext={!showMobileBottomNav} />
      {/if}

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <div class="flex flex-row items-center gap-2 lg:flex">
          {#if mode === MODES.edit}
            <span class="ui:text-muted-foreground text-sm" aria-live="polite">
              {#if savingTitle || savingInstructions}
                {$t('course.navItem.lessons.saving')}
              {:else if !titleDirty && !instructionsDirty && !settingsDirty}
                {$t('course.navItem.lessons.saved')}
              {/if}
            </span>
          {/if}
          <IconButton
            onclick={toggleMode}
            disabled={savingTitle || savingInstructions}
            aria-label={mode === MODES.edit ? $t('course.navItem.lessons.view') : $t('course.navItem.lessons.edit')}
          >
            {#if mode === MODES.edit}
              <Save size={20} />
            {:else}
              <Pencil size={20} />
            {/if}
          </IconButton>
        </div>

        <IconButton
          class="inline-flex"
          onclick={() => setHistoryQueryParam(true)}
          aria-label={$t('course.navItem.lessons.version_history.title')}
          tooltip={$t('course.navItem.lessons.version_history.title')}
          tooltipSide="bottom"
          disabled={!attachedPackage}
        >
          <HistoryIcon size={20} />
        </IconButton>

        <span class="hidden lg:inline-flex">
          <RefreshPageData onRefresh={refreshEditor} />
        </span>
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <div class={`overflow-x-hidden pb-4 ${mode === MODES.edit ? 'lg:w-full xl:w-11/12' : 'mx-auto w-full'}`}>
      {#if $isCourseLearnerView}
        <ActivityPlayer {courseId} {activityId} />
      {:else if mode === MODES.view}
        {#if attachedPackage}
          <ActivityPlayer {courseId} {activityId} />
        {:else}
          <Empty
            title={$t('course.navItem.lessons.activities.package.empty_title')}
            description={$t('course.navItem.lessons.materials.body_content') +
              ' ' +
              $t('course.navItem.lessons.materials.get_started') +
              ' ' +
              $t('course.navItem.lessons.materials.button') +
              '.'}
            icon={PackageIcon}
            variant="page"
            class="text-center"
          >
            <Button onclick={toggleMode}>
              {$t('course.navItem.lessons.materials.get_started')}
            </Button>
          </Empty>
        {/if}
      {:else}
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
              <PackageIcon class="custom size-4 shrink-0" />
              {$t('course.navItem.lessons.activities.tabs.package')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="instructions">
              <FileTextIcon class="custom size-4 shrink-0" />
              {$t('course.navItem.lessons.activities.tabs.instructions')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="results">
              <AwardIcon class="custom size-4 shrink-0" />
              {$t('course.navItem.lessons.activities.tabs.results')}
            </UnderlineTabs.Trigger>
            <UnderlineTabs.Trigger value="settings">
              <SettingsIcon class="custom size-4 shrink-0" />
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
              {:else if !attachedPackage}
                <Button onclick={() => openAddPackageModal('attach')} class="float-end my-4" disabled={!hasScormAccess}>
                  {$t('course.navItem.lessons.activities.package.upload_package')}
                </Button>

                <Empty
                  title={$t('course.navItem.lessons.activities.package.empty_title')}
                  description={$t('course.navItem.lessons.activities.package.empty_description')}
                  icon={PackageIcon}
                />
              {:else}
                <PackageDetails
                  details={attachedPackage}
                  moduleOrder={editorSettings?.moduleOrder ?? null}
                  {staleCount}
                  {staleVersionNumber}
                  onUpgrade={handleUpgradeRequest}
                  onSwap={() => (swapOpen = true)}
                  onRemove={handleRemoveRequest}
                  onMoveStale={() => (moveStaleOpen = true)}
                />
              {/if}
            </div>
          </UnderlineTabs.Content>

          <UnderlineTabs.Content value="instructions">
            <div class="space-y-4 py-4">
              <TextareaField
                label={$t('course.navItem.lessons.activities.instructions.label')}
                value={instructions}
                rows={6}
                placeholder={$t('course.navItem.lessons.activities.instructions.placeholder')}
                oninput={(e) => handleInstructionsChange(e.currentTarget.value)}
              />
            </div>
          </UnderlineTabs.Content>

          <UnderlineTabs.Content value="results">
            <div class="py-4">
              <ActivityResultsPanel
                {courseId}
                {activityId}
                refreshKey={resultsRefreshKey}
                onSelectLearner={openLearnerSheet}
              />
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
                  {passMark}
                  moduleCount={(attachedPackage?.units ?? []).length}
                  disabled={!hasScormAccess}
                  bind:dirty={settingsDirty}
                  bind:saving={settingsSaving}
                  bind:this={settingsPanel}
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
                {#if affectedCount > 0}
                  {$t('course.navItem.lessons.activities.delete_confirm_body_with_count', {
                    count: affectedCount
                  })}
                {:else}
                  {$t('course.navItem.lessons.activities.delete_confirm_body')}
                {/if}
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
                {#if affectedCount > 0}
                  {$t('course.navItem.lessons.activities.package.swap_confirm_body_with_count', {
                    count: affectedCount
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
                  handleSwapRequest();
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
                {#if affectedCount > 0}
                  {$t('course.navItem.lessons.activities.package.remove_confirm_body_with_count', {
                    count: affectedCount
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

        <Dialog.Root open={revertOpen} onOpenChange={handleRevertOpenChange}>
          <Dialog.Content class="w-96 p-6">
            <Dialog.Header class="p-2">
              <Dialog.Title>
                {$t('course.navItem.lessons.activities.package.revert_confirm_title', {
                  version: revertTargetVersion?.versionNumber ?? 1
                })}
              </Dialog.Title>
              <Dialog.Description>
                {#if affectedCount > 0}
                  {$t('course.navItem.lessons.activities.package.revert_confirm_body_with_count', {
                    count: affectedCount,
                    version: revertTargetVersion?.versionNumber ?? 1
                  })}
                {:else}
                  {$t('course.navItem.lessons.activities.package.revert_confirm_body', {
                    version: revertTargetVersion?.versionNumber ?? 1
                  })}
                {/if}
              </Dialog.Description>
            </Dialog.Header>

            {#if inProgressCount > 0}
              <div class="mt-4 space-y-2 rounded-lg border p-3 text-sm">
                <p class="text-xs font-medium">
                  {$t('course.navItem.lessons.activities.package.replace_choice_title')}
                </p>
                <label class="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="revert-choice"
                    class="mt-0.5"
                    checked={!revertCloseOpenAttempts}
                    onchange={() => (revertCloseOpenAttempts = false)}
                  />
                  <div>
                    <p class="text-xs font-medium">
                      {$t('course.navItem.lessons.activities.package.replace_keep')}
                    </p>
                    <p class="ui:text-muted-foreground text-xs">
                      {$t('course.navItem.lessons.activities.package.replace_keep_hint', { count: inProgressCount })}
                    </p>
                  </div>
                </label>
                <label class="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="revert-choice"
                    class="mt-0.5"
                    checked={revertCloseOpenAttempts}
                    onchange={() => (revertCloseOpenAttempts = true)}
                  />
                  <div>
                    <p class="text-xs font-medium">
                      {$t('course.navItem.lessons.activities.package.replace_restart')}
                    </p>
                    <p class="ui:text-muted-foreground text-xs">
                      {$t('course.navItem.lessons.activities.package.replace_restart_hint', { count: inProgressCount })}
                    </p>
                  </div>
                </label>
              </div>
            {/if}

            <div class="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" onclick={() => (revertOpen = false)} disabled={reverting}>
                {$t('delete_modal.no')}
              </Button>
              <Button size="sm" onclick={confirmRevertVersion} loading={reverting}>
                {$t('course.navItem.lessons.activities.package.revert_confirm_button')}
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

        <AddPackageModal
          bind:open={addPackageModalOpen}
          {courseId}
          {activityId}
          assetId={attachedPackage?.asset.id ?? null}
          mode={addPackageModalMode}
          inProgressCount={attachedPackage ? inProgressCount : 0}
          currentFingerprint={attachedPackage ? currentFingerprint : null}
          getFreshInProgressCount={refreshAttemptCounts}
          onAttached={refreshEditor}
          onReplaced={refreshEditor}
          onSwapRequest={handleSwapRequest}
          onUpgradeRequest={handleUpgradeRequest}
        />
      {/if}
    </div>
  {/snippet}
</Page.Body>

<UnsavedChanges bind:hasUnsavedChanges onAbandon={abandonPendingEdits} />

{#if !$isCourseLearnerView && mode === MODES.edit && currentTab === 'settings'}
  <Page.SettingsActions
    hasChanges={settingsDirty}
    loading={settingsSaving}
    statusLabel={$t('common.unsaved_changes.label')}
    discardLabel={$t('common.discard')}
    saveLabel={$t('common.save_changes')}
    onSave={saveSettings}
    onDiscard={discardSettings}
  />
{/if}

{#if isVersionDrawerOpen && attachedPackage}
  <ActivityVersionHistory
    open={isVersionDrawerOpen}
    packageDetails={attachedPackage}
    moduleOrder={editorSettings?.moduleOrder ?? null}
    onClose={() => setHistoryQueryParam(false)}
    onRevert={handleRevertRequest}
  />
{/if}
