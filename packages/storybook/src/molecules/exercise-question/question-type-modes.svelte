<script lang="ts">
  import { ExerciseQuestion } from '@cio/ui';
  import { QUESTION_LABELS } from './question-labels';

  interface Props {
    question: Record<string, unknown>;
    answer?: unknown;
  }

  type StoryQuestion = {
    id?: string | number;
    key?: string;
    questionType?: string;
    options?: Array<{ id?: string | number; label?: string; value?: string }>;
    settings?: Record<string, unknown>;
  };

  let { question, answer = null }: Props = $props();

  function cloneQuestion(source: Record<string, unknown>) {
    return JSON.parse(JSON.stringify(source));
  }

  function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  function buildSubmissionAnswerData(storyQuestion: StoryQuestion, index: number): Record<string, unknown> | null {
    const questionType = String(storyQuestion.questionType || 'SHORT_ANSWER');
    const options = storyQuestion.options || [];
    const optionIds = options
      .map((option) => option.id)
      .filter((id): id is string | number => id !== undefined && id !== null);

    switch (questionType) {
      case 'RADIO':
        return {
          type: 'RADIO',
          optionId: Number(optionIds[index % Math.max(optionIds.length, 1)] ?? 1)
        };
      case 'CHECKBOX':
        return {
          type: 'CHECKBOX',
          optionIds:
            optionIds.length > 1 ? [Number(optionIds[0]), Number(optionIds[(index + 1) % optionIds.length])] : [1]
        };
      case 'TRUE_FALSE':
        return { type: 'TRUE_FALSE', value: index % 3 !== 0 };
      case 'TEXTAREA':
        return {
          type: 'TEXTAREA',
          text:
            index % 3 === 0
              ? '<p><strong>Specific feedback</strong> helps learners understand what to improve next.</p>'
              : index % 3 === 1
                ? '<p>Break the task into <em>small measurable steps</em> and review each milestone.</p>'
                : '<p>Use the rubric as a checklist before submission.</p>'
        };
      case 'SHORT_ANSWER':
        return { type: 'SHORT_ANSWER', text: 'Use deterministic fixtures' };
      case 'NUMERIC':
        return { type: 'NUMERIC', value: 88 + (index % 6) };
      case 'FILL_BLANK':
        return {
          type: 'FILL_BLANK',
          values: index % 2 === 0 ? ['API'] : ['endpoint']
        };
      case 'FILE_UPLOAD':
        return {
          type: 'FILE_UPLOAD',
          fileKey: `uploads/story-${index + 1}.pdf`,
          fileName: `lesson-plan-${index + 1}.pdf`,
          mimeType: 'application/pdf'
        };
      case 'MATCHING': {
        const pairs = Array.isArray(storyQuestion.settings?.pairs)
          ? (storyQuestion.settings?.pairs as Array<{ left: string; right: string }>)
          : [
              { left: 'API', right: 'request validation' },
              { left: 'DB', right: 'persistent storage' }
            ];

        return { type: 'MATCHING', pairs };
      }
      case 'ORDERING': {
        const settingsItems = toStringArray(storyQuestion.settings?.items);
        const optionValues = options.map((option) => String(option.value || option.label || '').trim()).filter(Boolean);
        const orderedValues = settingsItems.length > 0 ? settingsItems : optionValues;
        return { type: 'ORDERING', orderedValues: orderedValues.length > 0 ? orderedValues : ['Step 1', 'Step 2'] };
      }
      case 'HOTSPOT':
        return {
          type: 'HOTSPOT',
          coordinates: [{ x: 40 + (index % 4) * 10, y: 50 + (index % 3) * 8 }]
        };
      case 'LINK':
        return {
          type: 'LINK',
          urls: [`https://example.com/resource-${index + 1}`]
        };
      default:
        return null;
    }
  }

  function buildSubmissionResponses(storyQuestion: StoryQuestion) {
    const questionId = storyQuestion.id ?? storyQuestion.key ?? 'story-question';

    return Array.from({ length: 12 }, (_, index) => {
      const answerData = buildSubmissionAnswerData(storyQuestion, index);

      return {
        id: `submission-${index + 1}`,
        studentName: `Student ${index + 1}`,
        answers: answerData
          ? [
              {
                questionId,
                answerData
              }
            ]
          : []
      };
    });
  }

  let editQuestion = $state<Record<string, unknown>>({});
  let viewAnswer = $state<unknown>(null);

  const submissionResponses = $derived(buildSubmissionResponses(question as StoryQuestion));

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

  <div class="ui:rounded-md ui:border ui:p-4 ui:space-y-3">
    <p class="ui:text-sm ui:font-semibold">Submission Mode (12 respondents)</p>
    <ExerciseQuestion.QuestionRenderer
      showContainer={false}
      contract={{
        mode: 'submission',
        question,
        submissions: submissionResponses,
        labels: QUESTION_LABELS,
        disabled: true
      }}
    />
  </div>
</div>
