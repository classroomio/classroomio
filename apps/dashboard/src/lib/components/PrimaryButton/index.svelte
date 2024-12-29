<script lang="ts">
  import { Loading } from 'carbon-components-svelte';
  import { VARIANTS, VARIANTS_CLASS } from './constants';

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

  $: loadingClass =
    isLoading || isDisabled
      ? 'cursor-not-allowed opacity-25'
      : `cursor-pointer ${!disableScale && 'hover:scale-95'}`;
  $: cname = `flex items-center h-auto ${loadingClass} ${
    VARIANTS_CLASS[isLoading ? VARIANTS.OUTLINED : variant]
  } ${
    !disablePadding && 'px-5 py-[0.2rem]'
  } rounded-md min-h-[36px] w-fit justify-center sm:w-auto ${
    variant !== VARIANTS.TEXT && 'hover:shadow-xl'
  } transition-all delay-150 duration-300 ease-in-out`;
</script>

<button
  class={`${cname} ${className}`}
  on:click={onClick}
  {name}
  {type}
  disabled={isLoading || isDisabled}
>
  {#if isLoading}
    <Loading withOverlay={false} small class="mr-2" />
  {/if}
  {#if !!label}
    {label}
  {:else}
    <slot />
  {/if}
</button>
