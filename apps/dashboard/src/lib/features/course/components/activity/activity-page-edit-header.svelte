<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { Spinner } from '@cio/ui/base/spinner';
  import UnlockIcon from '@lucide/svelte/icons/lock-open';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Page from '@cio/ui/base/page';
  import MODES from '$lib/utils/constants/mode';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { RoleBasedSecurity } from '$features/ui';

  interface Props {
    mode: (typeof MODES)[keyof typeof MODES];
    title: string;
    isUnlocked?: boolean | null;
    isDeletingActivity?: boolean;
    onTitleChange: (value: string) => void;
    onToggleLock: () => void;
    onRequestDelete: () => void;
  }

  let {
    mode,
    title,
    isUnlocked = false,
    isDeletingActivity = false,
    onTitleChange,
    onToggleLock,
    onRequestDelete
  }: Props = $props();

  const lockLabel = $derived(
    isUnlocked
      ? $t('course.navItem.lessons.activities.header_unlocked')
      : $t('course.navItem.lessons.activities.header_locked')
  );

  const displayTitle = $derived(
    title.trim() || $t('course.navItem.lessons.add_content_options.activity_scorm_default_title')
  );
</script>

<div class="flex w-full items-center justify-between gap-2">
  <div class="min-w-0 flex-1 space-y-2">
    {#if mode === MODES.edit && !$isOrgStudent}
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <InputField
          className="max-w-xl"
          value={title}
          placeholder={$t('course.navItem.lessons.add_content_options.activity_scorm_title_placeholder')}
          onInput={(e) => onTitleChange(e.currentTarget.value)}
        />
      </RoleBasedSecurity>
    {:else}
      <Page.Title>{displayTitle}</Page.Title>
    {/if}
  </div>

  {#if mode === MODES.edit && !$isOrgStudent}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <IconButton onclick={onToggleLock} aria-label={lockLabel} title={lockLabel}>
          {#if isUnlocked}
            <UnlockIcon size={18} />
          {:else}
            <LockIcon size={18} />
          {/if}
        </IconButton>

        <IconButton
          onclick={onRequestDelete}
          disabled={isDeletingActivity}
          aria-label={$t('course.navItem.lessons.activities.menu_delete')}
          tooltip={$t('course.navItem.lessons.activities.menu_delete')}
          tooltipSide="bottom"
        >
          {#if isDeletingActivity}
            <Spinner class="h-4 w-4" />
          {:else}
            <TrashIcon size={18} />
          {/if}
        </IconButton>
      </div>
    </RoleBasedSecurity>
  {/if}
</div>
