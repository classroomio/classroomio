<script lang="ts">
  interface Props {
    options?: any;
    classNames?: string;
    isIcon?: boolean;
    children?: import('svelte').Snippet;
  }

  let { options = [], classNames = 'relative', isIcon = false, children }: Props = $props();

  let open = $state(false);

  const notIconClass = 'border rounded-lg border-grey p-3 focus:outline-hidden focus:border-gray-400 focus:bg-gray-200';

  function isOptionLast(index) {
    return index === options.length - 1;
  }

  function onClick(option) {
    return () => {
      open = !open;
      if (option && option.onClick) {
        option.onClick();
      }
    };
  }

  function onBlur() {
    // In case an option was clicked, let's wait for the on:click of that button before we close
    setTimeout(() => (open = false), 100);
  }
</script>

<div class="{classNames} z-10 {!options.length && 'hidden'}">
  <button
    class="flex flex-row items-center {!isIcon && notIconClass}"
    onclick={(e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      open = !open;
    }}
    onblur={onBlur}
  >
    {@render children?.()}
  </button>

  {#if open}
    <div class="dropdown border-grey absolute mt-2 whitespace-nowrap rounded-lg border bg-white py-3 dark:bg-black">
      {#each options as option, index}
        <button
          class="hover:bg-primary-100 block px-4 py-3 text-left {!isOptionLast(index) &&
            'border-b'} w-full dark:text-white dark:hover:text-black"
          onclick={onClick(option)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown {
    box-shadow:
      0px 5px 5px -3px rgb(0 0 0 / 20%),
      0px 8px 10px 1px rgb(0 0 0 / 14%),
      0px 3px 14px 2px rgb(0 0 0 / 12%);
    right: 0px;
    top: 20px;
    left: unset;
  }
</style>
