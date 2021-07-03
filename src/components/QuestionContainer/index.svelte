<script>
  // import { onMount } from "svelte";
  import CloseButton from "../Buttons/Close/index.svelte";
  export let isTitle = false;
  export let onClose;
  export let scrollToQuestion = false;

  let ref;

  // onMount(() => {
  //   if (scrollToQuestion) {
  //     ref.scrollIntoView({ block: "end", behavior: "smooth" });
  //   }
  // });

  $: {
    if (ref && scrollToQuestion) {
      ref.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }
</script>

<div
  bind:this={ref}
  class="{isTitle
    ? 'border'
    : 'border-2'} border-gray border-r-2 rounded-md mb-6 relative root hover:border-blue-700"
>
  {#if isTitle}
    <div class="title absolute bg-blue-700" />
  {/if}

  {#if onClose}
    <div class="close-button hidden absolute -top-6 -right-6">
      <CloseButton onClick={onClose} contained={true} />
    </div>
  {/if}
  <div class="px-4 {isTitle ? 'pt-4' : 'pt-2'} pb-3">
    <slot />
  </div>
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
