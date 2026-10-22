<script lang="ts">
  import { untrack } from 'svelte';
  import { Button, Dialog, ExerciseQuestion } from '@cio/ui';
  import { QUESTION_LABELS } from '../exercise-question/question-labels';
  import { cloneJson } from './checkpoint-types';

  interface Props {
    sourceQuestion: Record<string, unknown>;
  }

  let { sourceQuestion }: Props = $props();

  let open = $state(false);
  let question = $state<Record<string, unknown>>(untrack(() => cloneJson(sourceQuestion)));

  function resetDraft() {
    question = cloneJson(sourceQuestion);
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      resetDraft();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Button.Root type="button" onclick={() => (open = true)}>Open editor</Button.Root>
  <Dialog.DialogContent class="ui:max-h-[90vh] ui:overflow-y-auto ui:sm:max-w-2xl">
    <Dialog.DialogHeader>
      <Dialog.DialogTitle>Edit checkpoint</Dialog.DialogTitle>
      <Dialog.DialogDescription>
        Same exercise edit renderer as the question bank. Type chips in Storybook are preview chrome only.
      </Dialog.DialogDescription>
    </Dialog.DialogHeader>
    <ExerciseQuestion.QuestionRenderer
      showContainer={false}
      contract={{
        mode: 'edit',
        question,
        labels: QUESTION_LABELS
      }}
      onQuestionChange={(nextQuestion) => (question = nextQuestion as Record<string, unknown>)}
    />
  </Dialog.DialogContent>
</Dialog.Root>
