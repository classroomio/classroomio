<script lang="ts">
  import * as Dialog from '../../base/dialog';
  import Button from '../../base/button/button.svelte';
  import { cn } from '../../tools';
  import { useImageCropperDialog } from './image-cropper-context.svelte';
  import type { ImageCropperDialogProps } from './types';
  import XIcon from '@lucide/svelte/icons/x';

  let { children, class: className, ...rest }: ImageCropperDialogProps = $props();

  const dialogState = useImageCropperDialog();
</script>

<Dialog.Root bind:open={dialogState.rootState.open}>
  <Dialog.Content
    {...rest}
    showCloseButton={false}
    class={cn(
      'ui:min-h-96 ui:max-w-[60%] ui:rounded-none ui:border-x-0 ui:sm:max-w-lg ui:sm:rounded-lg ui:sm:border-x',
      className
    )}
  >
    <Button
      type="button"
      variant="secondary"
      size="icon"
      class="ui:absolute ui:end-4 ui:top-4"
      onclick={() => dialogState.rootState.onCancel()}
    >
      <XIcon />
      <span class="ui:sr-only">Close</span>
    </Button>
    <div class="ui:flex ui:flex-col ui:gap-4">
      {@render children?.()}
    </div>
  </Dialog.Content>
</Dialog.Root>
