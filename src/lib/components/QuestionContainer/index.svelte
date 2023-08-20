<script>
  // import { onMount } from "svelte";
  import TextField from '../Form/TextField.svelte';
  import CloseButton from '../Buttons/Close/index.svelte';
  export let isTitle = false;
  export let onClose = () => {};
  export let scrollToQuestion = false;
  export let points = undefined;
  export let hasError = false;
  export let onPointsChange = () => {};
  let ref;

  // onMount(() => {
  //   if (scrollToQuestion) {
  //     ref.scrollIntoView({ block: "end", behavior: "smooth" });
  //   }
  // });

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
  class="bg-white dark:bg-gray-800 border {hasError
    ? 'border-red-700'
    : 'border-gray hover:border-primary-700'} rounded-md mb-6 relative root"
>
  {#if isTitle}
    <div class="title absolute bg-primary-700" />
  {/if}

  {#if onClose && !isTitle}
    <div class="close-button hidden absolute -top-6 -right-6">
      <CloseButton onClick={onClose} contained={true} />
    </div>
  {/if}
  <div class="px-4 {isTitle ? 'pt-4' : 'pt-2'} pb-3">
    <slot />
  </div>

  {#if typeof points !== 'undefined'}
    <div class="border-gray border-t-2 border-r-0 border-b-0 border-l-0 p-2">
      <div class="flex items-center w-40">
        <p class="dark:text-white text-sm mr-2">Points:</p>
        <TextField
          placeholder="Points"
          bind:value={points}
          type="number"
          onChange={onPointsChange}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .root:hover .close-button {
    display: block;
  }
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
