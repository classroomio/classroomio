<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  interface Props {
    courseId: string;
    courseTitle: string;
    templateLabel: string;
    isDirty: boolean;
    isSaving: boolean;
    isSignatureUploading?: boolean;
    isFreePlan: boolean;
    onSave: () => void;
    onDiscard: () => void;
  }

  let {
    courseId,
    courseTitle,
    templateLabel,
    isDirty,
    isSaving,
    isSignatureUploading = false,
    isFreePlan,
    onSave,
    onDiscard
  }: Props = $props();
</script>

<header
  class="ui:border-border ui:bg-background ui:text-foreground flex shrink-0 items-center justify-between gap-3 border-b px-3 py-3"
>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      href={resolve('/courses/[id]/certificates', { id: courseId })}
      class="ui:size-8 shrink-0"
      aria-label={$t('course.navItem.certificates.editor.back')}
    >
      <ArrowLeftIcon class="size-4" />
    </Button>

    <div class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <h1 class="truncate text-sm tracking-tight sm:text-base">
        {courseTitle}
      </h1>

      <div class="flex flex-wrap items-center gap-1">
        <Badge variant="secondary" class="text-[10px] uppercase">
          {templateLabel}
        </Badge>
        {#if isDirty}
          <Badge variant="outline" class="text-[10px]">
            {$t('course.navItem.certificates.editor.unsaved')}
          </Badge>
        {/if}
        {#if isFreePlan}
          <Badge variant="outline" class="text-[10px]">
            {$t('course.navItem.certificates.editor.free_plan')}
          </Badge>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex shrink-0 items-center gap-1.5">
    {#if isDirty}
      <Button variant="ghost" size="sm" type="button" onclick={onDiscard} class="hidden sm:inline-flex">
        {$t('course.navItem.certificates.editor.discard')}
      </Button>
    {/if}
    <Button
      variant="outline"
      size="sm"
      type="button"
      disabled={!isDirty || isSaving || isSignatureUploading}
      loading={isSaving}
      onclick={onSave}
    >
      {$t('course.navItem.certificates.editor.save')}
    </Button>
  </div>
</header>
