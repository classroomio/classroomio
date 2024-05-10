<script>
  import TextField from '../Form/TextField.svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let isTitle = false;
  export let onClose = () => {};
  export let scrollToQuestion = false;
  export let points = undefined;
  export let hasError = false;
  export let onPointsChange = () => {};

  let ref;

  $: {
    if (ref && scrollToQuestion) {
      ref.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
        inline: 'nearest'
      });
    }
  }
</script>

<div
  bind:this={ref}
  class="bg-white dark:bg-black border-2 {hasError
    ? 'border-red-700'
    : 'border-gray hover:border-primary-700'} rounded-md mb-6 relative root"
>
  {#if isTitle}
    <div class="title absolute bg-primary-700" />
  {/if}
  <div class="px-4 {isTitle ? 'pt-4' : 'pt-2'} pb-3">
    <slot />
  </div>

  {#if typeof points !== 'undefined'}
    <div
      class="flex justify-between items-center border-gray border-t-2 border-r-0 border-b-0 border-l-0 p-2"
    >
      <div class="flex items-center w-40">
        <p class="dark:text-white text-sm mr-2">
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
          <TrashCanIcon size={24} />
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
