<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import cloneDeep from 'lodash/cloneDeep';
  import isBoolean from 'lodash/isBoolean';
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import { CircleCheckIcon } from '$features/ui/icons';

  import { Preview, DeleteModal, QuizQuestion } from '$features/org';
  import { Button } from '@cio/ui/base/button';

  import { t } from '$lib/utils/functions/translations';
  import { quizApi } from '$features/org/api/quiz.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg, currentOrgPath, deleteModal, quizStore } from '$lib/utils/store/org';
  import { allOptions, allThemes, booleanOptions, themeImages } from '$lib/utils/constants/quiz';

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

  let { data } = $props();
  const { quizId } = data;

  // Questionnaire State
  let currentQuestion: QuizQuestion = $state(
    $quizStore.questions[0] || {
      id: 0,
      label: '',
      type: 'multichoice',
      options: []
    }
  );

  // Behavioural State
  let openPreview = $state(false);
  let type = $state('multichoice');
  let errors: Array<{
    isLabelEmpty: boolean;
    hasOneAnswer: boolean;
    id: number;
    options: Array<{ id: number; error: boolean }>;
  }> = $state([]);
  let currentError: {
    isLabelEmpty?: boolean;
    hasOneAnswer?: boolean;
    id?: number;
    options: Array<{ id: number; error: boolean }>;
  } = $state({});
  let isFocused = $state(false);

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

    if (!$currentOrg.id || !quizId) return;

    await quizApi.update($currentOrg.id, quizId, {
      ...$quizStore
    });

    if (quizApi.success) {
      snackbar.success('snackbar.course_settings.success.saved');
      // quizApi.quizzes is already updated by the API
    } else {
      snackbar.error('snackbar.course_settings.error.not_right');
    }
  }

  function qHasError(qId, _errs) {
    return _errs.some((qe) => {
      return (qId ? qe.id === qId : true) && (qe.isLabelEmpty || !qe.hasOneAnswer || !!qe.options.length);
    });
  }

  function optionHasError(eId, _errs) {
    if (Array.isArray(_errs) && _errs.length) {
      return _errs.some((e) => e.id === eId && e.error);
    }

    return false;
  }

  onMount(async () => {
    // First try to find quiz in the list
    let quiz = quizApi.quizzes.find((q) => q.id === quizId);

    // If not in list, fetch it
    if (!quiz && $currentOrg.id) {
      await quizApi.get($currentOrg.id, quizId);
      quiz = quizApi.quiz || undefined;
    }

    if (!quiz) {
      goto(`${$currentOrgPath}/quiz`);
      return;
    }

    // Map API Quiz to QuizStore format for quizStore
    quizStore.set({
      uuid: quiz.id,
      title: quiz.title,
      questions: quiz.questions || [],
      timelimit: quiz.timelimit || '10s',
      theme: quiz.theme || 'standard',
      pin: ''
    });
    currentQuestion = (quiz.questions || [])[0];
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
      <a class="text-md flex items-center text-gray-500 dark:text-white" href={`${$currentOrgPath}/quiz`}>
        <ArrowLeftIcon size={16} /> Back to Quizzes
      </a>

      <h3 class="my-3">Quiz</h3>

      <div class="mb-3">
        {#each $quizStore.questions as question, i}
          <button
            class="mb-3 flex w-full justify-between rounded p-3 text-left text-gray-500 dark:text-white {activeClass(
              question,
              currentQuestion
            )}"
            onclick={() => {
              currentQuestion = question;
              type = question.type;
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                currentQuestion = question;
                type = question.type;
              }
            }}
          >
            Question {i + 1}

            {#if qHasError(question.id, errors)}
              <CircleAlertIcon size={16} class="filled" />
            {/if}
          </button>
        {/each}
      </div>

      <div class="flex w-full justify-end">
        <Button onclick={addQuestion}>Add Question</Button>
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
        <h1 class="my-5 text-white">{$quizStore.title}</h1>

        <QuizQuestion {currentQuestion} {optionHasError} {currentError} />

        {#if isBoolean(currentError.hasOneAnswer) && !currentError.hasOneAnswer}
          <div class="mb-5">
            <p class="text-red-500">Please select at least one correct answer</p>
          </div>
        {/if}

        {#if currentQuestion.type !== 'boolean'}
          <div class="mb-4 flex w-full justify-center gap-4">
            {#if currentQuestion.options.length < allOptions.length}
              <Button onclick={addOption}>
                {$t('components.quiz.add_more')}
              </Button>
            {/if}
            {#if currentQuestion.options.length > 0}
              <Button onclick={deleteOption}>
                {$t('components.quiz.remove_last')}
              </Button>
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
      <Button onclick={saveQuiz} class="my-3">Save Changes</Button>
      <Button variant="outline" onclick={previewQuiz} class="my-3">Preview Quiz</Button>
      <Button
        variant="ghost"
        onclick={() => {
          if ($quizStore.questions.length === 1) return;
          $deleteModal.open = true;
          $deleteModal.isQuestion = true;
        }}
        class="my-3"
      >
        Delete question
      </Button>
      />
    </div>

    <div class="flex flex-col justify-evenly">
      <div class="my-3">
        <!-- Question type -->
        <div class="mb-3">
          <Label class="mb-2">Question type</Label>
          <Select.Root
            type="single"
            bind:value={type}
            onValueChange={(value) => {
              if (value) {
                handleQuestionTypeChange(value);
              }
            }}
          >
            <Select.Trigger class="w-full">
              <p>{type === 'multichoice' ? 'Multi-choice answers' : 'True or False'}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="multichoice">Multi-choice answers</Select.Item>
              <Select.Item value="boolean">True or False</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        <!--  -->
        <div class="mb-3">
          <Label class="mb-2">Time limit</Label>
          <Select.Root type="single" bind:value={$quizStore.timelimit}>
            <Select.Trigger class="w-full">
              <p>{$quizStore.timelimit || 'Select time limit'}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="10 seconds">10s</Select.Item>
              <Select.Item value="20 seconds">20s</Select.Item>
              <Select.Item value="30 seconds">30s</Select.Item>
              <Select.Item value="1 minute">1m</Select.Item>
              <Select.Item value="2 minute">2m</Select.Item>
              <Select.Item value="3 minute">3m</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <!-- Theme settings -->
      <div class="my-3">
        <p class="mb-2">Choose a theme</p>

        {#each allThemes as _theme}
          <div
            class="theme relative mb-5 w-full cursor-pointer rounded-md border {$quizStore.theme === _theme.id &&
              'border-primary-700'}"
          >
            {#if $quizStore.theme === _theme.id}
              <CircleCheckIcon size={16} filled />
            {/if}
            <div
              role="button"
              tabindex="0"
              class="flex h-full w-full flex-col-reverse rounded-md border"
              style="background: url({themeImages[_theme.id]?.card});"
              onclick={() => ($quizStore.theme = _theme.id)}
              onkeydown={(e) => {
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
