<script>
  import { VARIANTS, VARIANTS_CLASS } from "./constants";
  export let label;
  export let className = "";
  export let onClick = () => {};
  export let name = "";
  export let type;
  export let variant = VARIANTS.CONTAINED;
  export let disablePadding = false;
  export let isDisabled = false;

  const variantClass = VARIANTS_CLASS[variant];
</script>

<button
  class="{isDisabled &&
    'bg-opacity-25 hover:bg-opacity-25 cursor-not-allowed'} flex items-center h-auto {variantClass} {!disablePadding &&
    'py-1 px-5'} rounded {className} transition delay-150 duration-300 ease-in-out "
  on:click={onClick}
  {name}
  {type}
  disabled={isDisabled}
>
  {#if label}
    {label}
  {:else}
    <slot />
  {/if}
</button>
