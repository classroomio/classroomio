<script lang="ts">
  // import { Moon } from 'svelte-loading-spinners';
  import { VARIANTS, VARIANTS_CLASS } from './constants';
  import { Loading } from 'carbon-components-svelte';

  export let label = '';
  export let className = '';
  export let onClick = (e?: Event) => {};
  export let name = '';
  export let type: 'button' | 'submit' | 'reset' | null | undefined = 'button';
  export let variant = VARIANTS.CONTAINED;
  export let disablePadding = false;
  export let isDisabled = false;
  export let isLoading = false;
  export let disableScale = false;
</script>

<button
  class="{isLoading || isDisabled
    ? 'opacity-25 cursor-not-allowed'
    : `cursor-pointer ${
        !disableScale && 'hover:scale-95'
      }`} flex items-center h-auto {VARIANTS_CLASS[
    isLoading ? VARIANTS.OUTLINED : variant
  ]} {!disablePadding &&
    'py-[0.5rem] px-6'} rounded-md {className} w-fit min-h-[36px] justify-center sm:w-auto {variant !==
    VARIANTS.TEXT && 'hover:shadow-xl'} transition-all delay-150 duration-300 ease-in-out"
  on:click={onClick}
  {name}
  {type}
  disabled={isLoading || isDisabled}
>
  {#if isLoading}
    <Loading withOverlay={false} small class="mr-2" />
    <!-- <Moon size="20" color="#1d4ed8" unit="px" duration="1s" /> -->
  {/if}
  {#if !!label}
    {label}
  {:else}
    <slot />
  {/if}
</button>
