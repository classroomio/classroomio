<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
  import LibraryIcon from '@lucide/svelte/icons/library';
  import { t } from '$lib/utils/functions/translations';
  import PackageUpload from './package-upload.svelte';
  import LibraryPackage from './library-package.svelte';
  import type { PackageFingerprint } from '$features/course/utils/types';

  interface Props {
    open?: boolean;
    courseId: string;
    activityId: string;
    assetId?: string | null;
    mode?: 'attach' | 'upgrade' | 'swap';
    inProgressCount?: number;
    currentFingerprint?: PackageFingerprint | null;
    getFreshInProgressCount?: () => Promise<number>;
    onAttached?: (assetId: string) => void;
    onReplaced?: () => void;
    onClose?: () => void;
    onSwapRequest?: () => void;
    onUpgradeRequest?: () => void;
  }

  let {
    open = $bindable(false),
    courseId,
    activityId,
    assetId = null,
    mode = 'attach',
    inProgressCount = 0,
    currentFingerprint = null,
    getFreshInProgressCount,
    onAttached = () => {},
    onReplaced = () => {},
    onClose = () => {},
    onSwapRequest,
    onUpgradeRequest
  }: Props = $props();

  let currentTab = $state<'upload' | 'library'>('upload');
  let isBusy = $state(false);

  function handleOpenChange(isOpen: boolean) {
    if (isBusy && !isOpen) return;

    open = isOpen;
    if (!isOpen) {
      currentTab = 'upload';
      onClose();
    }
  }

  function handleAttached(newAssetId: string) {
    open = false;
    onAttached(newAssetId);
  }

  function handleReplaced() {
    open = false;
    onReplaced();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="flex max-h-[720px] max-w-2xl! flex-col overflow-hidden"
    showCloseButton={!isBusy}
    onEscapeKeydown={(e) => {
      if (isBusy) e.preventDefault();
    }}
    onInteractOutside={(e) => {
      if (isBusy) e.preventDefault();
    }}
    onCloseAutoFocus={(e) => {
      if (isBusy) e.preventDefault();
    }}
  >
    <Dialog.Header>
      <Dialog.Title>
        {#if mode === 'upgrade'}
          {$t('course.navItem.lessons.activities.package.upload_new_version')}
        {:else if mode === 'swap'}
          {$t('course.navItem.lessons.activities.package.swap_package')}
        {:else}
          {$t('course.navItem.lessons.activities.package.modal_title')}
        {/if}
      </Dialog.Title>
    </Dialog.Header>

    {#if mode === 'upgrade'}
      <div class="mt-2 min-w-0">
        <PackageUpload
          {courseId}
          {activityId}
          {assetId}
          {mode}
          {inProgressCount}
          {currentFingerprint}
          {getFreshInProgressCount}
          bind:isBusy
          onAttached={handleAttached}
          onReplaced={handleReplaced}
          {onSwapRequest}
          {onUpgradeRequest}
        />
      </div>
    {:else}
      <UnderlineTabs.Root bind:value={currentTab} class="min-w-0">
        <UnderlineTabs.List>
          <UnderlineTabs.Trigger
            value="upload"
            disabled={isBusy && currentTab !== 'upload'}
            class="flex items-center gap-2"
          >
            <HardDriveIcon size={16} />
            <span>{$t('course.navItem.lessons.activities.package.tabs.upload')}</span>
          </UnderlineTabs.Trigger>
          <UnderlineTabs.Trigger
            value="library"
            disabled={isBusy && currentTab !== 'library'}
            class="flex items-center gap-2"
          >
            <LibraryIcon size={16} />
            <span>{$t('course.navItem.lessons.activities.package.tabs.library')}</span>
          </UnderlineTabs.Trigger>
        </UnderlineTabs.List>

        <UnderlineTabs.Content value="upload" class="mt-3">
          <PackageUpload
            {courseId}
            {activityId}
            {assetId}
            {mode}
            {inProgressCount}
            {currentFingerprint}
            {getFreshInProgressCount}
            bind:isBusy
            onAttached={handleAttached}
            onReplaced={handleReplaced}
            {onSwapRequest}
            {onUpgradeRequest}
          />
        </UnderlineTabs.Content>

        <UnderlineTabs.Content value="library" class="mt-3">
          <LibraryPackage {courseId} {activityId} currentAssetId={assetId} onAttached={handleAttached} />
        </UnderlineTabs.Content>
      </UnderlineTabs.Root>
    {/if}
  </Dialog.Content>
</Dialog.Root>
