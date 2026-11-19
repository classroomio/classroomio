<script lang="ts">
  import { Input } from '@cio/ui/base/input';
  import * as Page from '@cio/ui/base/page';
  import MODES from '$lib/utils/constants/mode';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { RoleBasedSecurity } from '$features/ui';

  interface Props {
    mode: (typeof MODES)[keyof typeof MODES];
    title: string;
    onTitleChange: (value: string) => void;
  }

  let { mode, title, onTitleChange }: Props = $props();
</script>

<div class="flex w-full min-w-0 flex-col items-start">
  {#if mode === MODES.edit && !$isOrgStudent}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <Input
        aria-label={$t('course.navItem.lessons.add_lesson.lesson_title')}
        value={title}
        placeholder={$t('course.navItem.lessons.add_lesson.lesson_title')}
        class="ui:border-transparent ui:bg-transparent ui:shadow-none ui:hover:border-border ui:md:text-[21px] -my-px -ml-[5px] h-auto w-full max-w-[620px] rounded-md px-1 py-0 text-lg font-medium tracking-[-0.02em]"
        oninput={(event) => onTitleChange(event.currentTarget.value)}
        data-testid="lesson-title-input"
      />
    </RoleBasedSecurity>
  {:else}
    <Page.Title class="w-full text-lg font-medium tracking-[-0.02em] break-words md:text-[21px]">{title}</Page.Title>
  {/if}
</div>
