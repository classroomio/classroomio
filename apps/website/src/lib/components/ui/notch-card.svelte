<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    tab?: boolean;
    class?: string;
    notchClass?: string;
    tabClass?: string;
    children?: Snippet;
  }

  let {
    href,
    tab = false,
    class: className = 'bg-gray-50',
    notchClass = 'bg-white',
    tabClass = 'bg-gray-50',
    children
  }: Props = $props();
</script>

<svelte:element
  this={href ? 'a' : 'div'}
  {href}
  class="relative flex flex-col rounded-md px-[26px] pt-[30px] pb-[26px] {className}"
>
  {@render children?.()}
  <span
    aria-hidden="true"
    class="cio-notch pointer-events-none absolute -top-px left-6 z-[4] h-[11px] w-[46px] {notchClass}"
  ></span>
  {#if tab}
    <span
      aria-hidden="true"
      class="cio-tab pointer-events-none absolute -bottom-3 left-6 z-[3] h-3 w-[47.2px] {tabClass}"
    ></span>
  {/if}
</svelte:element>
