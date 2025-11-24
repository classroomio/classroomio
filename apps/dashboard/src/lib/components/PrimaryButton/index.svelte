<script lang="ts">
  import { Button } from '@cio/ui/base/button';

  import { VARIANTS, VARIANTS_CLASS, VARIANT_TO_BASE_VARIANT } from './constants';

  interface Props {
    label?: string;
    className?: string;
    onClick?: any;
    name?: string;
    type?: 'button' | 'submit' | 'reset' | null | undefined;
    variant?: any;
    disablePadding?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    disableScale?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    label = '',
    className = '',
    onClick = (e?: Event) => {},
    name = '',
    type = 'button',
    variant = VARIANTS.CONTAINED,
    disablePadding = false,
    isDisabled = false,
    isLoading = false,
    disableScale = false,
    children
  }: Props = $props();

  let loadingClass = $derived(
    isLoading || isDisabled ? 'cursor-not-allowed opacity-25' : `cursor-pointer ${!disableScale && 'hover:scale-95'}`
  );
  let cname = $derived(
    `flex items-center h-auto text-sm ${loadingClass} ${VARIANTS_CLASS[isLoading ? VARIANTS.OUTLINED : variant]} ${
      !disablePadding && 'px-5 py-[0.2rem]'
    } rounded-md min-h-[36px] w-fit justify-center sm:w-auto ${
      variant !== VARIANTS.TEXT && 'hover:shadow-xl'
    } transition-all delay-150 duration-300 ease-in-out`
  );
</script>

<Button
  variant={VARIANT_TO_BASE_VARIANT[variant]}
  {isLoading}
  disabled={isDisabled || isLoading}
  class={`${cname} ${className}`}
  onclick={onClick}
  {name}
  {type}
>
  {#if !!label}
    {label}
  {:else}
    {@render children?.()}
  {/if}
</Button>
