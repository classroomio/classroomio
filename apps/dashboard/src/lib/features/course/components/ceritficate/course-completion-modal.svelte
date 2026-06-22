<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Confetti } from '$features/ui';
  import { setConfetti } from '$features/ui/confetti/store';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseCompletionModal, closeCourseCompletionModal } from '$features/course/store/course-completion-modal';
  import { getContentRoute } from '$features/course/utils/content';
  import { formatBlockerMessage } from '$features/course/utils/certificate-utils';
  import { t } from '$lib/utils/functions/translations';

  let open = $state(false);
  let activeCourseId = $state('');
  let activeStep = $state<'checking' | 'eligible' | 'not-eligible'>('checking');
  let activeEvaluation = $state<Record<string, unknown> | null>(null);
  let activeExerciseId = $state<string | undefined>(undefined);

  onMount(() => {
    return courseCompletionModal.subscribe((v) => {
      if (v?.open && v.courseId) {
        activeCourseId = v.courseId;
        activeStep = v.step;
        activeEvaluation = v.evaluation as Record<string, unknown> | null;
        activeExerciseId = v.exerciseId;
        open = true;

        if (v.step === 'eligible' && !v.evaluation?.certificateEarnedAt) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 5500);
        }
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

  function goToExercise() {
    if (!activeCourseId || !activeExerciseId) return;
    onOpenChange(false);
    const path = getContentRoute(activeCourseId, { id: activeExerciseId, type: ContentType.Exercise });
    if (path) {
      goto(resolve(path, {}));
    }
  }

  function formatSingleBlocker() {
    if (!activeEvaluation) return '';
    const blockers = (activeEvaluation as Record<string, unknown>).blockers as
      | Array<Record<string, unknown>>
      | undefined;
    if (!blockers || blockers.length === 0) return '';
    return formatBlockerMessage(blockers[0] as Parameters<typeof formatBlockerMessage>[0]);
  }
</script>

<div class="pointer-events-none fixed inset-0 z-100">
  <Confetti />
</div>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="ui:max-w-md">
    {#if activeStep === 'checking'}
      <div class="flex flex-col items-center justify-center gap-4 py-8">
        <Spinner class="ui:size-8" />
        <p class="ui:text-muted-foreground text-sm">{$t('course.completion.modal.checking')}</p>
      </div>
    {:else if activeStep === 'eligible'}
      <Dialog.Header>
        <Dialog.Title>{$t('course.completion.modal.title')}</Dialog.Title>
        <Dialog.Description>{$t('course.completion.modal.subtitle')}</Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer class="ui:gap-2">
        <Button variant="outline" onclick={() => onOpenChange(false)}>{$t('course.completion.modal.later')}</Button>
        <Button onclick={goToCertificate}>{$t('course.completion.modal.view_certificate')}</Button>
      </Dialog.Footer>
    {:else if activeStep === 'not-eligible'}
      <Dialog.Header>
        <Dialog.Title>{$t('course.completion.modal.not_eligible_title')}</Dialog.Title>
      </Dialog.Header>
      <div class="ui:text-muted-foreground px-6 pb-4 text-center text-sm">
        <p>{formatSingleBlocker()}</p>
      </div>
      <Dialog.Footer class="ui:gap-2">
        <Button variant="outline" onclick={() => onOpenChange(false)}>{$t('course.completion.modal.later')}</Button>
        {#if activeExerciseId}
          <Button onclick={goToExercise}>{$t('course.completion.modal.retake_exercise')}</Button>
        {/if}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
