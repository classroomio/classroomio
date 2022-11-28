<script>
  import { BarLoader } from 'svelte-loading-spinners';
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

  $: variant = isLoading ? VARIANTS.OUTLINED : variant;
  $: isDisabled = isLoading ? true : isDisabled;
</script>

<button
  class="{isDisabled &&
    'bg-opacity-25 hover:bg-opacity-25 cursor-not-allowed'} flex items-center h-auto {VARIANTS_CLASS[
    variant
  ]} {!disablePadding &&
    'py-1 px-5'} rounded-none {className} py-2 w-full justify-center sm:w-auto {isLoading &&
    'py-4 border-blue-700'} transition delay-150 duration-300 ease-in-out"
  on:click={onClick}
  {name}
  {type}
  disabled={isDisabled}
>
  {#if isLoading}
    <BarLoader size="30" color="#1d4ed8" unit="px" duration="1s" />
  {:else if !!label}
    {label}
  {:else}
    <slot />
  {/if}
</button>
