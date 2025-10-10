<script lang="ts">
  interface Props {
    width?: string;
    padding?: string;
    className?: string;
    headerClassName?: string;
    onClick?: any;
    isPageNavHidden?: boolean;
    header?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let {
    width = 'max-w-4xl w-full lg:w-11/12',
    padding = $bindable('pb-5 px-4'),
    className = '',
    headerClassName = '',
    onClick = () => {},
    isPageNavHidden,
    header,
    children
  }: Props = $props();

  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick();
    }
  }
</script>

<div
  tabindex="0"
  class="overflow-y-auto {isPageNavHidden
    ? 'h-[calc(100vh-65px)] lg:h-[calc(100vh-127px)]'
    : 'h-[calc(100vh-127px)]'} mx-auto mt-4 {width} {className} relative {isPageNavHidden ? 'px-4 pb-20' : padding}"
  onclick={onClick}
  onkeydown={handleKeydown}
>
  {#if header}
    <div
      class="head sticky right-0 flex w-full items-center justify-between px-3 dark:bg-neutral-800 {headerClassName}"
    >
      {@render header?.()}
    </div>
  {/if}

  {@render children?.()}
</div>

<style>
  .head {
    top: 0px;
    z-index: 1;
  }
</style>
