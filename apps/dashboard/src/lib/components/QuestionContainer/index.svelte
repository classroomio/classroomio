<script lang="ts">
  import TextField from '../Form/TextField.svelte';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { IconButton } from '$lib/components/IconButton';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    isTitle?: boolean;
    onClose?: any;
    scrollToQuestion?: boolean;
    points?: any;
    hasError?: boolean;
    onPointsChange?: any;
    key?: string;
    children?: import('svelte').Snippet;
  }

  let {
    isTitle = false,
    onClose = () => {},
    scrollToQuestion = false,
    points = $bindable(undefined),
    hasError = false,
    onPointsChange = () => {},
    key,
    children
  }: Props = $props();

  let ref: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (ref && scrollToQuestion) {
      ref.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
        inline: 'nearest'
      });
    }
  });

  $effect(() => {
    console.log('container key', key);
  });
</script>

<div
  bind:this={ref}
  class="border-2 bg-white dark:bg-black {hasError
    ? 'border-red-700'
    : 'border-gray hover:border-primary-700'} root relative mb-6 rounded-md"
>
  {#if isTitle}
    <div class="title bg-primary-700 absolute"></div>
  {/if}
  <div class="px-4 {isTitle ? 'pt-4' : 'pt-2'} pb-3">
    {@render children?.()}
  </div>

  {#if typeof points !== 'undefined'}
    <div class="border-gray flex items-center justify-between border-b-0 border-l-0 border-r-0 border-t-2 p-2">
      <div class="flex w-40 items-center">
        <p class="mr-2 text-sm dark:text-white">
          {$t('course.navItem.lessons.exercises.new_exercise_modal.points')}:
        </p>
        <TextField
          placeholder={$t('course.navItem.lessons.exercises.new_exercise_modal.points')}
          bind:value={points}
          type="number"
          onChange={onPointsChange}
        />
      </div>

      {#if onClose && !isTitle}
        <IconButton onClick={onClose}>
          <TrashIcon size={16} />
        </IconButton>
      {/if}
    </div>
  {/if}
</div>

<style>
  .title {
    color: rgba(255, 255, 255, 1);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    height: 10px;
    left: -1px;
    top: -1px;
    width: calc(100% + 2px);
  }
</style>
