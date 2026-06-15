<script lang="ts">
  import Button, { type ButtonElementProps } from '../../base/button/button.svelte';
  import { useImageCropperUseOriginal } from './image-cropper-context.svelte';
  import ImageIcon from '@lucide/svelte/icons/image';

  let {
    ref = $bindable(null),
    variant = 'outline',
    size = 'sm',
    onclick,
    children,
    ...rest
  }: ButtonElementProps = $props();

  const useOriginalState = useImageCropperUseOriginal();
</script>

<Button
  {...rest}
  bind:ref
  {size}
  {variant}
  onclick={(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLButtonElement;
    }
  ) => {
    onclick?.(e);

    useOriginalState.onclick();
  }}
>
  <ImageIcon />
  {#if children}
    {@render children()}
  {:else}
    <span>Don't Crop</span>
  {/if}
</Button>
