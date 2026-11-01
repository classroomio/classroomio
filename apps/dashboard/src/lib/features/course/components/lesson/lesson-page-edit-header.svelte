<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import UnlockIcon from '@lucide/svelte/icons/lock-open';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as Page from '@cio/ui/base/page';
  import MODES from '$lib/utils/constants/mode';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { RoleBasedSecurity } from '$features/ui';

  interface Props {
    mode: (typeof MODES)[keyof typeof MODES];
    title: string;
    isUnlocked?: boolean | null;
    onTitleChange: (value: string) => void;
    onToggleLock: () => void;
  }

  let { mode, title, isUnlocked = false, onTitleChange, onToggleLock }: Props = $props();

  const lockLabel = $derived(
    isUnlocked ? $t('course.navItem.lessons.add_lesson.lock') : $t('course.navItem.lessons.add_lesson.unlock')
  );
</script>

<div class="flex w-full min-w-0 flex-col items-center md:items-start">
  {#if mode === MODES.edit && !$isOrgStudent}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <Input
        aria-label={$t('course.navItem.lessons.add_lesson.lesson_title')}
        value={title}
        placeholder={$t('course.navItem.lessons.add_lesson.lesson_title')}
        class="ui:border-transparent ui:bg-transparent ui:shadow-none ui:hover:border-border ui:md:text-[21px] -mt-1 -ml-2 h-auto w-full max-w-[620px] rounded-md px-2 py-1 text-[21px] font-medium tracking-[-0.02em]"
        oninput={(event) => onTitleChange(event.currentTarget.value)}
        data-testid="lesson-title-input"
      />
    </RoleBasedSecurity>
  {:else}
    <Page.Title class="text-[21px] font-medium tracking-[-0.02em]">{title}</Page.Title>
  {/if}

  {#if mode === MODES.edit && !$isOrgStudent}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          class="ui:text-muted-foreground ui:hover:text-foreground -ml-1 w-fit gap-1.5 px-2 font-normal"
          aria-label={lockLabel}
          title={lockLabel}
          aria-pressed={isUnlocked}
          onclick={onToggleLock}
          testId="lesson-lock-toggle"
        >
          {#if isUnlocked}
            <UnlockIcon size={12} />
          {:else}
            <LockIcon size={12} />
          {/if}
          <span>{isUnlocked ? $t('generic.unlocked') : $t('generic.locked')}</span>
        </Button>
      </div>
    </RoleBasedSecurity>
  {/if}
</div>
