<script lang="ts">
  import * as Select from '../../base/select';
  import {
    getExerciseQuestionContractKey,
    isAutoGradableQuestionTypeId,
    QUESTION_TYPE_KEY,
    type AnswerData,
    type ExerciseQuestionLabels,
    type ExerciseQuestionModel
  } from '@cio/question-types';
  import { untrack } from 'svelte';
  import { Button } from '../../base/button';
  import { QuestionList } from '../exercise-question';
  import { cn } from '../../tools';
  import Callout from './callout.svelte';
  import type { PublicCourseCalloutData, PublicExerciseViewData } from './types';
  import type { PublicExerciseStoredAttempt } from './public-exercise-attempts-storage';
  import { readPublicExerciseAttempts, writePublicExerciseAttempts } from './public-exercise-attempts-storage';

  interface Props {
    exercise: PublicExerciseViewData;
    callout?: PublicCourseCalloutData | null;
    labels?: ExerciseQuestionLabels;
    /** When set, completed attempts persist and hydrate from `localStorage`. */
    attemptsPersistenceKey?: string | null;
    formatAttemptOption?: (args: { attemptNumber: number; correct: number; total: number }) => string;
    newAttemptOptionLabel?: string;
    attemptsSelectAriaLabel?: string;
    submitLabel?: string;
    tryAgainLabel?: string;
    privacyHint?: string;
    summaryTemplate?: string;
    class?: string;
  }

  let {
    exercise,
    callout = null,
    labels,
    attemptsPersistenceKey = null,
    formatAttemptOption = ({ attemptNumber, correct, total }) => `Attempt ${attemptNumber} - ${correct}/${total}`,
    newAttemptOptionLabel = 'Practice again',
    attemptsSelectAriaLabel = 'Your attempts',
    submitLabel = 'Check my answers',
    tryAgainLabel = 'Practice again',
    privacyHint = 'Graded instantly in your browser — nothing is submitted.',
    summaryTemplate = 'You got [[correct]] / [[total]] correct.',
    class: className
  }: Props = $props();

  let persistedAttempts = $state<PublicExerciseStoredAttempt[]>([]);
  /** `'live'` = unsaved/new round; `'0'`.. = index into persisted attempts. */
  let selectValue = $state<string>('live');
  let answers = $state<Record<string, AnswerData>>({});
  let submitted = $state(false);

  const mode = $derived<'take' | 'review'>(submitted ? 'review' : 'take');

  $effect(() => {
    attemptsPersistenceKey;
    untrack(() => {
      persistedAttempts = readPublicExerciseAttempts(attemptsPersistenceKey);
      const rows = persistedAttempts;
      if (rows.length === 0) {
        selectValue = 'live';
        answers = {};
        submitted = false;
        return;
      }

      const defaultIndex = rows.length - 1;
      selectValue = String(defaultIndex);
      const row = rows[defaultIndex];
      answers = structuredClone(row.answersByKey);
      submitted = true;
    });
  });

  function handleAttemptSelect(selected: string) {
    if (selected === 'live') {
      selectValue = 'live';
      answers = {};
      submitted = false;
      return;
    }

    const idx = Number.parseInt(selected, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= persistedAttempts.length) return;

    selectValue = selected;
    submitted = true;
    answers = structuredClone(persistedAttempts[idx].answersByKey);
  }

  function handleAnswerChange(question: ExerciseQuestionModel, answer: AnswerData | null) {
    if (submitted) return;

    const key = getExerciseQuestionContractKey(question);
    if (answer === null) {
      const next = { ...answers };
      delete next[key];
      answers = next;
      return;
    }

    answers = { ...answers, [key]: answer };
  }

  function hasProvidedAnswer(question: ExerciseQuestionModel, answer: AnswerData | undefined): boolean {
    if (!answer) return false;

    switch (question.questionType) {
      case QUESTION_TYPE_KEY.RADIO:
        return answer.type === 'RADIO' && answer.optionId != null;
      case QUESTION_TYPE_KEY.CHECKBOX:
        return answer.type === 'CHECKBOX' && answer.optionIds.length > 0;
      case QUESTION_TYPE_KEY.TRUE_FALSE:
        return answer.type === 'TRUE_FALSE';
      case QUESTION_TYPE_KEY.TEXTAREA:
        return answer.type === 'TEXTAREA' && answer.text.trim().length > 0;
      case QUESTION_TYPE_KEY.SHORT_ANSWER:
        return answer.type === 'SHORT_ANSWER' && answer.text.trim().length > 0;
      case QUESTION_TYPE_KEY.NUMERIC:
        return answer.type === 'NUMERIC' && Number.isFinite(answer.value);
      case QUESTION_TYPE_KEY.FILL_BLANK: {
        if (answer.type !== 'FILL_BLANK') return false;
        const blankSlots = (question.options ?? []).filter((option) => option.isCorrect !== false).length;
        if (blankSlots === 0) return false;

        return (
          answer.values.length >= blankSlots &&
          answer.values.slice(0, blankSlots).every((value) => typeof value === 'string' && value.trim().length > 0)
        );
      }
      case QUESTION_TYPE_KEY.ORDERING: {
        if (answer.type !== 'ORDERING') return false;
        const expectedLength = (question.options ?? [])
          .map((option) => String(option.value ?? option.label ?? ''))
          .filter(Boolean).length;

        return (
          expectedLength > 0 &&
          answer.orderedValues.length === expectedLength &&
          answer.orderedValues.every((value) => typeof value === 'string' && value.length > 0)
        );
      }
      default:
        return false;
    }
  }

  const canSubmitAnswers = $derived(
    exercise.questions.length > 0 &&
      exercise.questions.every((question, index) =>
        hasProvidedAnswer(question, answers[getExerciseQuestionContractKey(question, index)])
      )
  );

  function isAnswerCorrect(question: ExerciseQuestionModel, answer: AnswerData | undefined): boolean | null {
    if (!answer) return false;

    switch (question.questionType) {
      case QUESTION_TYPE_KEY.RADIO: {
        if (answer.type !== 'RADIO') return false;
        const correctOption = (question.options ?? []).find((option) => option.isCorrect);
        if (!correctOption?.id) return false;
        return String(correctOption.id) === String(answer.optionId);
      }
      case QUESTION_TYPE_KEY.CHECKBOX: {
        if (answer.type !== 'CHECKBOX') return false;
        const correctIds = new Set(
          (question.options ?? [])
            .filter((option) => option.isCorrect && option.id !== undefined)
            .map((option) => String(option.id))
        );
        const selected = new Set(answer.optionIds.map(String));
        if (selected.size !== correctIds.size) return false;
        for (const id of correctIds) {
          if (!selected.has(id)) return false;
        }
        return true;
      }
      case QUESTION_TYPE_KEY.TRUE_FALSE: {
        if (answer.type !== 'TRUE_FALSE') return false;
        const correctOption = (question.options ?? []).find((option) => option.isCorrect);
        const correctValue = /true/i.test(String(correctOption?.label ?? correctOption?.value ?? ''));
        return answer.value === correctValue;
      }
      case QUESTION_TYPE_KEY.SHORT_ANSWER: {
        if (answer.type !== 'SHORT_ANSWER') return false;
        const caseSensitive = Boolean((question.settings as { caseSensitive?: boolean } | undefined)?.caseSensitive);
        const accepted = (question.options ?? [])
          .filter((option) => option.isCorrect !== false)
          .map((option) => String(option.label ?? option.value ?? '').trim());
        const submittedValue = answer.text.trim();
        if (!submittedValue || accepted.length === 0) return false;
        return accepted.some((expected) => {
          if (caseSensitive) return expected === submittedValue;
          return expected.toLowerCase() === submittedValue.toLowerCase();
        });
      }
      case QUESTION_TYPE_KEY.NUMERIC: {
        if (answer.type !== 'NUMERIC') return false;
        const settings = (question.settings ?? {}) as { correctValue?: unknown; tolerance?: unknown };
        const correctOption = (question.options ?? []).find((option) => option.isCorrect);
        const correctValue = Number(correctOption?.label ?? correctOption?.value ?? settings.correctValue ?? NaN);
        const tolerance = Number(settings.tolerance ?? 0);
        if (!Number.isFinite(correctValue)) return null;
        return Math.abs(answer.value - correctValue) <= (Number.isFinite(tolerance) ? tolerance : 0);
      }
      case QUESTION_TYPE_KEY.FILL_BLANK: {
        if (answer.type !== 'FILL_BLANK') return false;
        const accepted = (question.options ?? [])
          .filter((option) => option.isCorrect !== false)
          .map((option) =>
            String(option.label ?? option.value ?? '')
              .trim()
              .toLowerCase()
          );
        if (accepted.length === 0) return null;
        return answer.values.every((value, index) => {
          const expected = accepted[index];
          if (expected === undefined) return false;
          return value.trim().toLowerCase() === expected;
        });
      }
      case QUESTION_TYPE_KEY.ORDERING: {
        if (answer.type !== 'ORDERING') return false;
        const expected = (question.options ?? [])
          .map((option) => String(option.value ?? option.label ?? ''))
          .filter(Boolean);
        if (expected.length === 0) return null;
        return (
          answer.orderedValues.length === expected.length &&
          answer.orderedValues.every((value, index) => value === expected[index])
        );
      }
      default:
        return null;
    }
  }

  const totalGradable = $derived(
    exercise.questions.reduce((count, question) => {
      const typeId = (question as ExerciseQuestionModel & { questionTypeId?: number }).questionTypeId;
      const isAutoGradable = typeof typeId === 'number' ? isAutoGradableQuestionTypeId(typeId) : true;
      return isAutoGradable ? count + 1 : count;
    }, 0)
  );

  const correctCountComputed = $derived(
    submitted
      ? exercise.questions.reduce((count, question) => {
          const key = getExerciseQuestionContractKey(question);
          return isAnswerCorrect(question, answers[key]) === true ? count + 1 : count;
        }, 0)
      : 0
  );

  /** When reviewing a stored snapshot, scores are pinned to saved numbers (handles changed rubrics later). */
  const displayCorrectCount = $derived.by(() => {
    if (!submitted) return correctCountComputed;
    const idx =
      selectValue !== 'live'
        ? Number.parseInt(selectValue, 10)
        : persistedAttempts.length > 0
          ? persistedAttempts.length - 1
          : -1;
    if (Number.isInteger(idx) && idx >= 0 && idx < persistedAttempts.length) {
      return persistedAttempts[idx].correctCount;
    }
    return correctCountComputed;
  });

  const displayTotalGradable = $derived.by(() => {
    if (!submitted) return totalGradable;
    const idx =
      selectValue !== 'live'
        ? Number.parseInt(selectValue, 10)
        : persistedAttempts.length > 0
          ? persistedAttempts.length - 1
          : -1;
    if (Number.isInteger(idx) && idx >= 0 && idx < persistedAttempts.length) {
      return persistedAttempts[idx].totalGradable;
    }
    return totalGradable;
  });

  const summaryText = $derived(
    summaryTemplate
      .replace('[[correct]]', String(displayCorrectCount))
      .replace('[[total]]', String(displayTotalGradable))
  );

  const showAttemptsPicker = $derived(
    !!attemptsPersistenceKey && persistedAttempts.length > 0 && exercise.questions.length > 0 && exercise.isUnlocked
  );

  function handleSubmit() {
    if (!canSubmitAnswers) return;

    submitted = true;

    if (!attemptsPersistenceKey) return;

    const correct = exercise.questions.reduce((count, question) => {
      const key = getExerciseQuestionContractKey(question);
      return isAnswerCorrect(question, answers[key]) === true ? count + 1 : count;
    }, 0);
    const tot = totalGradable;

    const snapshot: PublicExerciseStoredAttempt = {
      savedAt: new Date().toISOString(),
      answersByKey: structuredClone(answers),
      correctCount: correct,
      totalGradable: tot
    };

    persistedAttempts = [...persistedAttempts, snapshot];
    writePublicExerciseAttempts(attemptsPersistenceKey, persistedAttempts);
    selectValue = String(persistedAttempts.length - 1);
  }

  function handleReset() {
    selectValue = 'live';
    answers = {};
    submitted = false;
  }

  /** Trigger text when user is reviewing a frozen attempt vs starting fresh. */
  const tryAgainButtonLabel = $derived(
    showAttemptsPicker && selectValue !== 'live' ? newAttemptOptionLabel : tryAgainLabel
  );
</script>

<article class={cn('ui:mx-auto ui:w-full ui:max-w-3xl ui:px-4 ui:py-8 ui:sm:px-6 ui:lg:py-10', className)}>
  {#if !exercise.isUnlocked}
    <Callout variant="full" {callout} />
  {:else}
    {#if exercise.sectionTitle}
      <div class="ui:text-xs ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
        {exercise.sectionTitle}
      </div>
    {/if}

    {#if showAttemptsPicker}
      <div class="ui:mt-4 ui:flex ui:flex-wrap ui:items-center ui:gap-2">
        <span class="ui:sr-only" id="public-exercise-attempts-select-label">{attemptsSelectAriaLabel}</span>
        <Select.Root
          type="single"
          value={selectValue}
          onValueChange={(nextValue) => nextValue && handleAttemptSelect(nextValue)}
        >
          <Select.Trigger
            class="ui:min-w-[min(24rem,calc(100vw-5rem))] ui:max-w-full"
            aria-labelledby="public-exercise-attempts-select-label"
          >
            <span class="ui:truncate">
              {selectValue === 'live'
                ? newAttemptOptionLabel
                : formatAttemptOption({
                    attemptNumber: Number(selectValue) + 1,
                    correct: persistedAttempts[Number(selectValue)]?.correctCount ?? 0,
                    total: persistedAttempts[Number(selectValue)]?.totalGradable ?? totalGradable
                  })}
            </span>
          </Select.Trigger>
          <Select.Content>
            {#each persistedAttempts as _, attemptIdx (attemptIdx)}
              {@const stored = persistedAttempts[attemptIdx]}
              {@const attemptLabel = formatAttemptOption({
                attemptNumber: attemptIdx + 1,
                correct: stored.correctCount,
                total: stored.totalGradable
              })}
              <Select.Item value={String(attemptIdx)} label={attemptLabel}>{attemptLabel}</Select.Item>
            {/each}
            <Select.Item value="live" label={newAttemptOptionLabel}>{newAttemptOptionLabel}</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    {/if}

    <h1
      class={cn(
        'ui:text-2xl ui:tracking-tight ui:text-foreground ui:sm:text-3xl',
        showAttemptsPicker ? 'ui:mt-4' : 'ui:mt-2'
      )}
    >
      {exercise.title}
    </h1>

    {#if exercise.description}
      <p class="ui:mt-3 ui:text-muted-foreground">{exercise.description}</p>
    {/if}

    <div class="ui:mt-8 ui:space-y-6">
      <QuestionList
        contract={{
          mode,
          questions: exercise.questions,
          answersByKey: answers,
          disabled: submitted,
          labels
        }}
        onAnswerChange={handleAnswerChange}
      />
    </div>

    <div class="ui:mt-10 ui:flex ui:items-center ui:justify-between ui:gap-4">
      {#if submitted}
        <div class="ui:text-sm ui:text-muted-foreground">{summaryText}</div>
        <Button variant="outline" onclick={handleReset}>{tryAgainButtonLabel}</Button>
      {:else}
        <span class="ui:text-sm ui:text-muted-foreground">{privacyHint}</span>
        <Button disabled={!canSubmitAnswers} onclick={handleSubmit}>{submitLabel}</Button>
      {/if}
    </div>

    <Callout variant="inline" {callout} />
  {/if}
</article>
