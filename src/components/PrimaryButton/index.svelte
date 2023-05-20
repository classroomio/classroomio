<script>
  import { Moon } from 'svelte-loading-spinners';
  import { VARIANTS, VARIANTS_CLASS } from './constants';

  export let label = '';
  export let className = '';
  export let onClick = () => {};
  export let name = '';
  export let type = 'button';
  export let variant = VARIANTS.CONTAINED;
  export let disablePadding = false;
  export let isDisabled = false;
  export let isLoading = false;

  $: isDisabled = isLoading ? true : false;
</script>

<button
  class="{isDisabled
    ? 'bg-opacity-25 hover:bg-opacity-25 cursor-not-allowed'
    : 'cursor-pointer'} flex items-center h-auto {VARIANTS_CLASS[
    isLoading ? VARIANTS.OUTLINED : variant
  ]} {!disablePadding &&
    'py-3 px-5'} rounded-none {className} w-fit justify-center sm:w-auto {isLoading &&
    'py-3 border-blue-700'} hover:shadow-xl transition delay-150 duration-300 ease-in-out"
  on:click={onClick}
  {name}
  {type}
  disabled={isDisabled}
>
  {#if isLoading}
    <Moon size="20" color="#1d4ed8" unit="px" duration="1s" />
  {:else if !!label}
    {label}
  {:else}
    <slot />
  {/if}
</button>
