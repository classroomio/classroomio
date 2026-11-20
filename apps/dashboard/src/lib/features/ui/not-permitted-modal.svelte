<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
    entityType?: 'course' | 'learning_path';
    title?: string;
    description?: string;
    buttonText?: string;
    onAction?: () => void;
  }

  let { open = $bindable(false), entityType = 'course', title, description, buttonText, onAction }: Props = $props();

  const defaultTitle = $derived(
    entityType === 'learning_path' ? $t('learningPath.not_permitted.header') : $t('course.not_permitted.header')
  );

  const defaultDescription = $derived(
    entityType === 'learning_path' ? $t('learningPath.not_permitted.body') : $t('course.not_permitted.body')
  );

  const defaultButtonText = $derived(
    entityType === 'learning_path' ? $t('learningPath.not_permitted.button') : $t('course.not_permitted.button')
  );
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) open = false;
  }}
>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{title ?? defaultTitle}</Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="text-md text-center dark:text-white">
        {description ?? defaultDescription}
      </p>

      {#if onAction}
        <div class="mt-5 flex justify-center">
          <Button onclick={onAction}>
            {buttonText ?? defaultButtonText}
          </Button>
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
