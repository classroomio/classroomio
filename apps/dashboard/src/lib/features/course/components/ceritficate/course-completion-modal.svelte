<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Confetti } from '$features/ui';
  import { setConfetti } from '$features/ui/confetti/store';
  import { courseCompletionModal, closeCourseCompletionModal } from '$features/course/store/course-completion-modal';
  import { t } from '$lib/utils/functions/translations';

  let open = $state(false);
  let activeCourseId = $state('');

  onMount(() => {
    return courseCompletionModal.subscribe((v) => {
      if (v?.open && v.courseId) {
        activeCourseId = v.courseId;
        open = true;
        setConfetti(true);
        setTimeout(() => setConfetti(false), 5500);
      } else {
        open = false;
      }
    });
  });

  function onOpenChange(next: boolean) {
    open = next;
    if (!next) {
      closeCourseCompletionModal();
    }
  }

  function goToCertificate() {
    if (!activeCourseId) return;
    onOpenChange(false);
    goto(resolve(`/courses/${activeCourseId}/certificates`, {}));
  }
</script>

<div class="pointer-events-none fixed inset-0 z-100">
  <Confetti />
</div>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="ui:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('course.completion.modal.title')}</Dialog.Title>
      <Dialog.Description>{$t('course.completion.modal.subtitle')}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="ui:gap-2">
      <Button variant="outline" onclick={() => onOpenChange(false)}>{$t('course.completion.modal.later')}</Button>
      <Button onclick={goToCertificate}>{$t('course.completion.modal.view_certificate')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
