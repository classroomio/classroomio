<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathCourseItem } from '../utils/types';

  interface Props {
    open: boolean;
    course: LearningPathCourseItem | null;
    onClose: () => void;
    onConfirm: (courseId: string) => void;
  }

  let { open = $bindable(false), course, onClose, onConfirm }: Props = $props();
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
  <Dialog.Content class="bg-card text-foreground border-border max-w-md border">
    <Dialog.Header>
      <Dialog.Title class="text-foreground text-lg font-semibold">
        {$t('learningPath.modals.remove_course.title')}
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground text-sm">
        {#if course}
          <strong>{course.title}</strong> —
        {/if}
        {$t('learningPath.modals.remove_course.description')}
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer class="mt-4 gap-2 sm:gap-0">
      <Button
        type="button"
        variant="outline"
        onclick={() => {
          open = false;
          onClose();
        }}
      >
        {$t('learningPath.modals.remove_course.cancel')}
      </Button>
      <Button
        type="button"
        variant="destructive"
        onclick={() => {
          if (course) {
            onConfirm(course.id);
          }
          open = false;
          onClose();
        }}
      >
        {$t('learningPath.modals.remove_course.confirm')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
