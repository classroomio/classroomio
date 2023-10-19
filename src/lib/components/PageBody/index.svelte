<script>
  // import
  //   border border-gray-300 rounded-md p-3 bg-primary-200 bg-opacity-25
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
    : 'h-[calc(100vh-127px)]'} mt-4 mx-auto {width} {className} relative {padding}"
  on:click={onClick}
>
  {#if $$slots.header}
    <div
      class="head dark:bg-neutral-800 flex items-center justify-between sticky right-0 w-full px-3 {headerClassName}"
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
