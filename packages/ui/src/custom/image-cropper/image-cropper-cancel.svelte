<script lang="ts">
  import Button, { type ButtonElementProps } from '../../base/button/button.svelte';
  import { useImageCropperCancel } from './image-cropper.svelte.js';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  let { ref = $bindable(null), variant = 'outline', size = 'sm', onclick, ...rest }: ButtonElementProps = $props();

  const cancelState = useImageCropperCancel();
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

    cancelState.onclick();
  }}
>
  <Trash2Icon />
  <span>Cancel</span>
</Button>
