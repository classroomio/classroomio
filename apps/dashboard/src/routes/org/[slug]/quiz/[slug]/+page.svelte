<script lang="ts">
  import { goto } from '$app/navigation';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import WarningFilledIcon from 'carbon-icons-svelte/lib/WarningFilled.svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import isBoolean from 'lodash/isBoolean';
  import { onMount } from 'svelte';

  import DeleteModal from '$lib/components/Org/Quiz/DeleteModal.svelte';
  import Preview from '$lib/components/Org/Quiz/Play/Preview.svelte';
  import QuizQuestion from '$lib/components/Org/Quiz/QuizQuestion.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { allOptions, allThemes, booleanOptions, themeImages } from '$lib/utils/constants/quiz';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, deleteModal, quizStore, quizesStore } from '$lib/utils/store/org';
  import { Select, SelectItem } from 'carbon-components-svelte';

  interface QuizOption {
    id: number;
    label: string;
    isCorrect: boolean;
  }

  interface QuizQuestion {
    id: number;
    label: string;
    type: string;
    options: QuizOption[];
  }

  export let data;
  const { quizId } = data;

  // Questionnaire State
  let currentQuestion: QuizQuestion = $quizStore.questions[0] || {
    id: 0,
    label: '',
    type: 'multichoice',
    options: []
  };

  // Behavioural State
  let openPreview = false;
  let type = 'multichoice';
  let errors: Array<{
    isLabelEmpty: boolean;
    hasOneAnswer: boolean;
    id: number;
    options: Array<{ id: number; error: boolean }>;
  }> = [];
  let currentError: {
    isLabelEmpty?: boolean;
    hasOneAnswer?: boolean;
    id?: number;
    options?: Array<{ id: number; error: boolean }>;
  } = {};
  let isFocused = false;
  let selectEl: Select | null = null;

  function activeClass(q, cq) {
    if (q.id === cq.id) {
      return 'bg-gray-200 dark:bg-black';
    }
    return '';
  }

  function addQuestion() {
    const newQuestion: QuizQuestion = {
      id: new Date().getTime(),
      label: '',
      type: 'multichoice',
      options: []
    };
    $quizStore.questions = [...$quizStore.questions, newQuestion];
    type = 'multichoice';
  }

  function addOption() {
    const cOptIds = currentQuestion.options.map((o) => o.id);
    const nextOption = cloneDeep(allOptions).find((o) => !cOptIds.includes(Number(o.id)));

    if (!nextOption) return;

    currentQuestion.options = [
      ...currentQuestion.options,
      {
        id: Number(nextOption.id),
        label: nextOption.label,
        isCorrect: nextOption.isCorrect
      }
    ];
  }

  function deleteOption() {
    const opt = cloneDeep(currentQuestion.options);
    opt.pop();
    currentQuestion.options = opt;
  }

  function handleQuestionTypeChange(type: string) {
    const opt =
      type === 'multichoice'
        ? cloneDeep(allOptions)
            .filter((o, i) => i < 2)
            .map((o) => ({
              id: Number(o.id),
              label: o.label,
              isCorrect: o.isCorrect
            }))
        : cloneDeep(booleanOptions).map((o) => ({
            id: Number(o.id),
            label: o.label,
            isCorrect: o.isCorrect
          }));

    currentQuestion.type = type;
    currentQuestion.options = opt;
  }

  function deleteQuestion() {
    // Only leave one question
    if ($quizStore.questions.length === 1) return;
    $quizStore.questions = $quizStore.questions.filter((q) => q.id !== currentQuestion.id);
    currentQuestion = $quizStore.questions[0];
  }

  function previewQuiz() {
    openPreview = !openPreview;
  }

  function validateQuiz() {
    const _errors: Array<{
      isLabelEmpty: boolean;
      hasOneAnswer: boolean;
      id: number;
      options: Array<{ id: number; error: boolean }>;
    }> = [];

    $quizStore.questions.forEach((q) => {
      const labelError = !!((q.label?.length || 0) < 3);
      const options: Array<{ id: number; error: boolean }> = [];
      let hasOneAnswer = false;

      q.options.forEach((o) => {
        const valLabelError = !!(o.label.length < 3);

        if (valLabelError) {
          options.push({
            id: o.id,
            error: true
          });
        }

        if (o.isCorrect) {
          hasOneAnswer = true;
        }
      });

      _errors.push({
        isLabelEmpty: labelError,
        hasOneAnswer,
        id: q.id,
        options
      });
    });

    errors = _errors;
    currentError = errors.find((e) => e.id === currentQuestion.id) || {};
    return errors;
  }

  async function saveQuiz() {
    const _errors = validateQuiz();
    if (Array.isArray(_errors) && _errors.length && qHasError(null, _errors)) {
      console.error('Please fix all errors', errors);
      return;
    }

    const { data, error } = await supabase
      .from('quiz')
      .update({
        ...$quizStore,
        updated_at: new Date()
      })
      .match({ id: quizId });

    console.log('data', data);
    console.log('error', error);
    if (error) {
      snackbar.error('snackbar.course_settings.error.not_right');
      return;
    } else {
      snackbar.success('snackbar.course_settings.success.saved');
    }
  }

  function qHasError(qId, _errs) {
    return _errs.some((qe) => {
      return (
        (qId ? qe.id === qId : true) && (qe.isLabelEmpty || !qe.hasOneAnswer || !!qe.options.length)
      );
    });
  }

  function optionHasError(eId, _errs) {
    if (Array.isArray(_errs) && _errs.length) {
      return _errs.some((e) => e.id === eId && e.error);
    }

    return false;
  }

  onMount(() => {
    const quiz = $quizesStore.find((q) => q.id === quizId);
    if (!quiz) {
      goto(`${$currentOrgPath}/quiz`);
      return;
    }
    quizStore.set(quiz);
    currentQuestion = quiz.questions[0];
  });
</script>

<svelte:head>
  <title>Quiz</title>
</svelte:head>

<DeleteModal onDelete={deleteQuestion} />

{#if openPreview}
  <Preview exitPreview={previewQuiz} />
{/if}

<section class="flex h-full w-screen justify-between">
  <!-- Questions list -->
  <aside class="root h-full w-1/5 bg-gray-100 p-4 dark:bg-neutral-800">
    <div class="flex h-full flex-col">
      <a
        class="text-md flex items-center text-gray-500 dark:text-white"
        href={`${$currentOrgPath}/quiz`}
      >
        <ArrowLeftIcon size={24} class="carbon-icon dark:text-white" /> Back to Quizzes
      </a>

      <h3 class="my-3">Quiz</h3>

      <div class="mb-3">
        {#each $quizStore.questions as question, i}
          <button
            class="mb-3 flex w-full justify-between rounded p-3 text-left font-bold text-gray-500 dark:text-white {activeClass(
              question,
              currentQuestion
            )}"
            on:click={() => {
              currentQuestion = question;
              type = question.type;
            }}
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                currentQuestion = question;
                type = question.type;
              }
            }}
          >
            Question {i + 1}

            {#if qHasError(question.id, errors)}
              <WarningFilledIcon size={20} class="carbon-icon error" />
            {/if}
          </button>
        {/each}
      </div>

      <div class="flex w-full justify-end">
        <PrimaryButton label="Add Question" variant={VARIANTS.CONTAINED} onClick={addQuestion} />
      </div>
    </div>
  </aside>

  <div class="container h-full w-3/6">
    <div
      class="h-full p-5"
      style="background: url({themeImages[$quizStore.theme]
        ?.editor}) no-repeat center center fixed; -webkit-background-size: cover;-moz-background-size: cover;-o-background-size: cover;background-size: cover;"
    >
      <div class="content m-auto">
        <h1 class="my-5 font-bold text-white">{$quizStore.title}</h1>

        <QuizQuestion {currentQuestion} {optionHasError} {currentError} />

        {#if isBoolean(currentError.hasOneAnswer) && !currentError.hasOneAnswer}
          <div class="mb-5">
            <p class="text-red-500">Please select at least one correct answer</p>
          </div>
        {/if}

        {#if currentQuestion.type !== 'boolean'}
          <div class="mb-4 flex w-full justify-center">
            {#if currentQuestion.options.length < allOptions.length}
              <PrimaryButton
                label={$t('components.quiz.add_more')}
                variant={VARIANTS.CONTAINED_WHITE}
                onClick={addOption}
                className="mr-5"
              />
            {/if}
            {#if currentQuestion.options.length > 0}
              <PrimaryButton
                label={$t('components.quiz.remove_last')}
                variant={VARIANTS.CONTAINED_WHITE}
                onClick={deleteOption}
              />
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Quiz Settings -->
  <aside class="settings h-full w-1/5 bg-gray-100 p-4 dark:bg-neutral-800">
    <div class="py-5">
      <h5>Quiz settings</h5>
      <PrimaryButton
        label="Save Changes"
        variant={VARIANTS.CONTAINED}
        onClick={saveQuiz}
        className="my-3"
      />
      <PrimaryButton
        label="Preview Quiz"
        variant={VARIANTS.OUTLINED}
        onClick={previewQuiz}
        className="my-3"
      />
      <PrimaryButton
        label="Delete question"
        variant={VARIANTS.TEXT}
        onClick={() => {
          if ($quizStore.questions.length === 1) return;
          $deleteModal.open = true;
          $deleteModal.isQuestion = true;
        }}
        className="my-3"
      />
    </div>

    <div class="flex flex-col justify-evenly">
      <div class="my-3">
        <!-- Question type -->
        <Select
          labelText="Question type"
          bind:this={selectEl}
          bind:selected={type}
          class="mb-3 flex items-center"
          on:focus={() => (isFocused = true)}
          on:blur={() => (isFocused = false)}
          on:change={() => {
            if (!isFocused) return;
            // Blur after change
            const onBlur = selectEl?.$$?.callbacks?.blur?.[0];
            const onFocus = selectEl?.$$?.callbacks?.focus?.[0];
            setTimeout(() => {
              onBlur();
              onFocus();
            }, 1000);

            handleQuestionTypeChange(type);
          }}
        >
          <SelectItem value="multichoice" text="Multi-choice answers" />
          <SelectItem value="boolean" text="True or False" />
        </Select>

        <!--  -->
        <Select
          labelText="Time limit"
          bind:selected={$quizStore.timelimit}
          class="mb-3 flex items-center"
        >
          <SelectItem value="10 seconds" text="10s" />
          <SelectItem value="20 seconds" text="20s" />
          <SelectItem value="30 seconds" text="30s" />
          <SelectItem value="1 minute" text="1m" />
          <SelectItem value="2 minute" text="2m" />
          <SelectItem value="3 minute" text="3m" />
        </Select>
      </div>

      <!-- Theme settings -->
      <div class="my-3">
        <p class="mb-2">Choose a theme</p>

        {#each allThemes as _theme}
          <div
            class="theme relative mb-5 w-full cursor-pointer rounded-md border {$quizStore.theme ===
              _theme.id && 'border-primary-700'}"
          >
            {#if $quizStore.theme === _theme.id}
              <CheckmarkFilledIcon
                size={24}
                class="carbon-icon absolute right-4 top-4"
                style="fill:white;"
              />
            {/if}
            <div
              role="button"
              tabindex="0"
              class="flex h-full w-full flex-col-reverse rounded-md border"
              style="background: url({themeImages[_theme.id]?.card});"
              on:click={() => ($quizStore.theme = _theme.id)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  $quizStore.theme = _theme.id;
                }
              }}
            >
              <p class="mb-3 ml-3 text-white">{_theme.label}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </aside>
</section>

<style>
  .container {
    min-width: 696px;
  }
  .content {
    max-width: 550px;
  }
  .theme {
    height: 120px;
    max-width: 260px;
  }
</style>
