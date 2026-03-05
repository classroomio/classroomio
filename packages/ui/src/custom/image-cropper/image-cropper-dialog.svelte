<script lang="ts">
  import * as Dialog from '../../base/dialog';
  import { cn } from '../../tools';
  import { useImageCropperDialog } from './image-cropper.svelte.js';
  import type { ImageCropperDialogProps } from './types';

  let { children, class: className, ...rest }: ImageCropperDialogProps = $props();

  const dialogState = useImageCropperDialog();
</script>

<Dialog.Root bind:open={dialogState.rootState.open}>
  <Dialog.Content
    {...rest}
    showCloseButton
    class={cn(
      'ui:min-h-96 ui:max-w-[60%] ui:rounded-none ui:border-x-0 ui:sm:ui:max-w-lg ui:sm:ui:rounded-lg ui:sm:ui:border-x',
      className
    )}
  >
    <div class="ui:flex ui:flex-col ui:gap-4">
      {@render children?.()}
    </div>
  </Dialog.Content>
</Dialog.Root>
