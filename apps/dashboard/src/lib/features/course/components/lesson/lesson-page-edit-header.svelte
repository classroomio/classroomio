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
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import { slugifyTitle } from '@cio/utils/validation';

  interface Props {
    mode: (typeof MODES)[keyof typeof MODES];
    title: string;
    isUnlocked?: boolean | null;
    isDeletingLesson?: boolean;
    onTitleChange: (value: string) => void;
    onToggleLock: () => void;
    onDeleteLesson: () => Promise<void> | void;
    slug?: string;
    showSlugEditor?: boolean;
    slugError?: string;
    onSlugChange?: (value: string) => void;
  }

  let {
    mode,
    title,
    isUnlocked = false,
    isDeletingLesson = false,
    onTitleChange,
    onToggleLock,
    onDeleteLesson,
    slug = '',
    showSlugEditor = false,
    slugError,
    onSlugChange = () => {}
  }: Props = $props();

  // Slug field: commented out via `{#if false && ...}` below — drop `false &&` to show again.

  let openDeleteModal = $state(false);

  const lockLabel = $derived(
    isUnlocked ? $t('course.navItem.lessons.add_lesson.lock') : $t('course.navItem.lessons.add_lesson.unlock')
  );
</script>

<div class="flex w-full items-center justify-between gap-2">
  <div class="min-w-0 flex-1 space-y-2">
    {#if mode === MODES.edit && !$isOrgStudent}
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <InputField
          className="max-w-xl"
          value={title}
          placeholder={$t('course.navItem.lessons.add_lesson.lesson_title')}
          onInputChange={(e) => onTitleChange(e.currentTarget.value)}
        />
        {#if false && showSlugEditor}
          <InputField
            className="max-w-xl"
            label={$t('course.navItem.settings.slug.label')}
            helperMessage={$t('course.navItem.settings.slug.description')}
            value={slug}
            placeholder={slugifyTitle(title || '')}
            onInputChange={(e) => onSlugChange(e.currentTarget.value)}
            errorMessage={slugError}
          />
        {/if}
      </RoleBasedSecurity>
    {:else}
      <Page.Title>{title}</Page.Title>
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
          onclick={() => (openDeleteModal = true)}
          disabled={isDeletingLesson}
          aria-label={$t('course.navItem.lessons.add_lesson.delete_tooltip')}
          tooltip={$t('course.navItem.lessons.add_lesson.delete_tooltip')}
          tooltipSide="bottom"
        >
          {#if isDeletingLesson}
            <Spinner class="h-4 w-4" />
          {:else}
            <TrashIcon size={18} />
          {/if}
        </IconButton>
      </div>
    </RoleBasedSecurity>
  {/if}
</div>

<DeleteLessonConfirmation bind:openDeleteModal deleteLesson={onDeleteLesson} />
