<script lang="ts">
  import { ExerciseQuestion } from '@cio/ui';
  import { QUESTION_LABELS } from './question-labels';

  interface Props {
    question: Record<string, unknown>;
    answer?: unknown;
  }

  let { question, answer = null }: Props = $props();

  function cloneQuestion(source: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(source));
  }

  let editQuestion = $state<Record<string, unknown>>({});
  let viewAnswer = $state<unknown>(null);

  $effect(() => {
    editQuestion = cloneQuestion(question);
    viewAnswer = answer;
  });
</script>

<div class="ui:mb-5 ui:space-y-4">
  <div class="ui:rounded-md ui:border ui:p-4 ui:space-y-3">
    <p class="ui:text-sm ui:font-semibold">View Mode</p>
    <ExerciseQuestion.QuestionRenderer
      showContainer={false}
      contract={{
        mode: 'view',
        question,
        answer: viewAnswer,
        labels: QUESTION_LABELS
      }}
      onAnswerChange={(nextAnswer) => (viewAnswer = nextAnswer)}
    />
  </div>

  <div class="ui:rounded-md ui:border ui:p-4 ui:space-y-3">
    <p class="ui:text-sm ui:font-semibold">Edit Mode</p>
    <ExerciseQuestion.QuestionRenderer
      showContainer={false}
      contract={{
        mode: 'edit',
        question: editQuestion,
        labels: QUESTION_LABELS
      }}
      onQuestionChange={(nextQuestion) => (editQuestion = nextQuestion)}
    />
  </div>

  <div class="ui:rounded-md ui:border ui:p-4 ui:space-y-3">
    <p class="ui:text-sm ui:font-semibold">Preview Mode</p>
    <ExerciseQuestion.QuestionRenderer
      showContainer={false}
      contract={{
        mode: 'preview',
        question,
        answer: viewAnswer,
        labels: QUESTION_LABELS,
        disabled: true
      }}
    />
  </div>
</div>
