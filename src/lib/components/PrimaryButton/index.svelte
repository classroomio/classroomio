<script>
  // import { Moon } from 'svelte-loading-spinners';
  import { VARIANTS, VARIANTS_CLASS } from './constants';
  import { Loading } from 'carbon-components-svelte';

  export let label = '';
  export let className = '';
  export let onClick = () => {};
  export let name = '';
  export let type = 'button';
  export let variant = VARIANTS.CONTAINED;
  export let disablePadding = false;
  export let isDisabled = false;
  export let isLoading = false;

  $: isDisabled = isLoading ? true : isDisabled;
</script>

<button
  class="{isDisabled
    ? 'opacity-25 cursor-not-allowed'
    : 'cursor-pointer'} flex items-center h-auto {VARIANTS_CLASS[
    isLoading ? VARIANTS.OUTLINED : variant
  ]} {!disablePadding &&
    'py-[0.5rem] px-6'} rounded-md {className} w-fit min-h-[36px] justify-center sm:w-auto {isLoading &&
    'py-[1rem] border-primary-700'} {variant !== VARIANTS.TEXT &&
    'hover:shadow-xl'} transition delay-150 duration-300 ease-in-out {variant !==
  VARIANTS.CONTAINED_WHITE
    ? 'dark:text-white'
    : ''}"
  on:click={onClick}
  {name}
  {type}
  disabled={isDisabled}
>
  {#if isLoading}
    <Loading withOverlay={false} small />
    <!-- <Moon size="20" color="#1d4ed8" unit="px" duration="1s" /> -->
  {:else if !!label}
    {label}
  {:else}
    <slot />
  {/if}
</button>
