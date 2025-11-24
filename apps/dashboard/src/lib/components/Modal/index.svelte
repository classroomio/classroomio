<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';

  interface Props {
    open?: boolean;
    onClose?: () => void;
    modalHeading?: string;
    headerClass?: string;
    labelClass?: string;
    width?: string;
    maxWidth?: string;
    containerClass?: string;
    size?: string;
    isCloseable?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    open = $bindable(false),
    onClose = () => {},
    modalHeading = '',
    headerClass = '',
    labelClass = '',
    width = '',
    maxWidth = '',
    containerClass = '',
    size = '',
    isCloseable = true,
    children
  }: Props = $props();

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      onClose();
    }
  }

  $effect(() => {
    console.log('Modal open state:', open);
  });
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="{maxWidth || 'max-w-[1000px]'} {size === 'sm' ? 'max-w-[388px]' : ''} {width} rounded-md p-0 shadow-lg"
  >
    <Dialog.Header
      class="{headerClass} flex items-center justify-between border-b border-gray-100 p-4 px-5 dark:border-neutral-600"
    >
      <Dialog.Title class="m-0 font-medium dark:text-white {labelClass}">
        {modalHeading}
      </Dialog.Title>
    </Dialog.Header>

    <div class="max-h-[60vh] w-full overflow-y-auto p-6 {containerClass}">
      {@render children?.()}
    </div>
  </Dialog.Content>
</Dialog.Root>
