<script lang="ts">
  import { ExerciseQuestion } from '@cio/ui';
  import { QUESTION_LABELS } from './question-labels';

  interface Props {
    question: Record;
    answer?: unknown;
    viewAnswer?: unknown;
    /** When set, renders an additional Review block with this incorrect `AnswerData`. */
    wrongAnswer?: unknown;
  }

  type StoryQuestion = {
    id?: string | number;
    key?: string;
    questionType?: string;
    options?: Array<{ id?: string | number; label?: string; value?: string }>;
    settings?: Record<string, unknown>;
  };

  let { question, answer = null, viewAnswer: initialViewAnswer = answer, wrongAnswer = undefined }: Props = $props();

  function cloneQuestion(source: Record) {
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
      case 'STAR': {
        const rawMax = storyQuestion.settings?.maxStars;
        const maxStars =
          typeof rawMax === 'number' && Number.isFinite(rawMax) ? Math.min(10, Math.max(1, Math.floor(rawMax))) : 5;
        const rawCorrect = storyQuestion.settings?.correctValue;
        const correct =
          typeof rawCorrect === 'number' && Number.isFinite(rawCorrect)
            ? Math.min(maxStars, Math.max(1, Math.floor(rawCorrect)))
            : Math.min(3, maxStars);
        if (index % 4 === 0) return { type: 'STAR', value: correct };
        return { type: 'STAR', value: (index % maxStars) + 1 };
      }
      case 'FILL_BLANK':
        return {
          type: 'FILL_BLANK',
          values: index % 2 === 0 ? ['API'] : ['endpoint']
        };
      case 'WORD_BANK': {
        const correct = Array.isArray(storyQuestion.settings?.correctAnswers)
          ? (storyQuestion.settings.correctAnswers as string[]).map((s) => String(s ?? ''))
          : ['alpha', 'beta'];
        const blankCount = Math.max(1, correct.length);
        if (index % 4 === 0) {
          return { type: 'WORD_BANK', filledBlanks: correct.slice(0, blankCount) };
        }
        if (index % 4 === 1) {
          const wrongFirst = ['wrong term', ...correct.slice(1)].slice(0, blankCount);
          return { type: 'WORD_BANK', filledBlanks: wrongFirst };
        }
        if (index % 4 === 2 && blankCount > 1) {
          const swapped = [...correct.slice(0, blankCount)];
          [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
          return { type: 'WORD_BANK', filledBlanks: swapped };
        }
        return {
          type: 'WORD_BANK',
          filledBlanks: Array.from({ length: blankCount }, () => '')
        };
      }
      case 'FILE_UPLOAD':
        return {
          type: 'FILE_UPLOAD',
          fileKey: `uploads/story-${index + 1}.pdf`,
          fileName: `lesson-plan-${index + 1}.pdf`,
          mimeType: 'application/pdf'
        };
      case 'VIDEO_RECORDING':
        return {
          type: 'VIDEO_RECORDING',
          assetId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
          storageKey: `exercise-recordings/story/submission-${index + 1}.webm`,
          fileName: `reflection-${index + 1}.webm`,
          mimeType: 'video/webm',
          size: 900_000 + index * 25_000,
          durationSeconds: 30 + (index % 6) * 5,
          recordedAt: '2026-04-30T12:00:00.000Z',
          uploadedAt: '2026-04-30T12:01:00.000Z',
          provider: 'cloudflare',
          retakeCount: index % 4,
          playbackUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm'
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
    viewAnswer = initialViewAnswer;
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
    <p class="ui:text-sm ui:font-semibold">Review Mode</p>
    <p class="ui:text-muted-foreground ui:text-xs">
      Read-only submission replay with correctness (same as grading / finished exercise in the app).
    </p>
    <ExerciseQuestion.QuestionRenderer
      showContainer={false}
      contract={{
        mode: 'review',
        question,
        answer,
        labels: QUESTION_LABELS,
        disabled: true
      }}
    />
  </div>

  {#if wrongAnswer !== undefined}
    <div class="ui:rounded-md ui:border ui:p-4 ui:space-y-3">
      <p class="ui:text-sm ui:font-semibold">Review Mode (incorrect)</p>
      <p class="ui:text-muted-foreground ui:text-xs">
        Same review UI when the submitted answer does not match the correct solution.
      </p>
      <ExerciseQuestion.QuestionRenderer
        showContainer={false}
        contract={{
          mode: 'review',
          question,
          answer: wrongAnswer,
          labels: QUESTION_LABELS,
          disabled: true
        }}
      />
    </div>
  {/if}

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
