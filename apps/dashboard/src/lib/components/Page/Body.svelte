<script>
  export let width = 'max-w-4xl w-full lg:w-11/12';
  export let padding = 'pb-5 px-4';
  export let className = '';
  export let headerClassName = '';
  export let onClick = () => {};
  export let isPageNavHidden = false;

  $: padding = isPageNavHidden ? `pb-20 px-4` : padding;
</script>

<div
  class="overflow-y-auto {isPageNavHidden
    ? 'h-[calc(100vh-65px)] lg:h-[calc(100vh-127px)]'
    : 'h-[calc(100vh-127px)]'} mx-auto mt-4 {width} {className} relative {padding}"
  on:click={onClick}
>
  {#if $$slots.header}
    <div
      class="head sticky right-0 flex w-full items-center justify-between px-3 dark:bg-neutral-800 {headerClassName}"
    >
      <slot name="header" />
    </div>
  {/if}

  <slot />
</div>

<style>
  .head {
    top: 0px;
    z-index: 1;
  }
</style>
