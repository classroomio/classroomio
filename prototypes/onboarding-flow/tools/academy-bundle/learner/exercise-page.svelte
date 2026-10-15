<script lang="ts">
  /*
   * pages/exercise.svelte + components/exercise/view-mode.svelte for a learner: the start screen, one question
   * at a time (real ExerciseQuestion renderers), submission with in-browser grading (packages/question-types
   * scoring, as the API does), the result with per-question review, attempts and Try again.
   */
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import InfoIcon from '@lucide/svelte/icons/info';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';
  import LockIcon from '@lucide/svelte/icons/lock';
  import XIcon from '@lucide/svelte/icons/x';
  import { fly } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';
  import * as ExerciseQuestion from '@cio/ui/custom/exercise-question';
  import * as Page from '@cio/ui/base/page';
  import * as Alert from '@cio/ui/base/alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { NumberBadge } from '@cio/ui/base/number-badge';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Empty } from '@cio/ui/custom/empty';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { getExerciseQuestionContractKey, type AnswerData } from '@cio/question-types';
  import { t, questionLabels } from '../copy';
  import { completesExercise, gradeAttempt, hasAnswerValue, isAutoGraded, toModels, type Attempt, type RawItem } from './model';

  interface Props {
    exercise: RawItem;
    courseType: string;
    isComplete: boolean;
    previous: RawItem | null;
    next: RawItem | null;
    showPrevNext: boolean;
    locked: boolean;
    store: any;
    notify: (message: string, kind?: 'success' | 'error' | 'info') => void;
    onComplete: () => void;
    onGo: (id: string) => void;
  }

  let { exercise, courseType, isComplete, previous, next, showPrevNext, locked, store, notify, onComplete, onGo }: Props = $props();

  const models = toModels(exercise.questions ?? []);
  const labels = questionLabels();
  const autoGraded = isAutoGraded(models);
  const allowMultiple = exercise.allowMultipleAttempts !== false;
  const totalPoints = models.reduce((sum, model) => sum + Number(model.points ?? 0), 0);
  const keyOf = (index: number) => getExerciseQuestionContractKey(models[index], index);

  let attempts = $state<Attempt[]>(store.attempts(exercise.id));
  let stage = $state<'start' | 'taking' | 'finished'>(attempts.length ? 'finished' : 'start');
  let viewed = $state(attempts.length - 1);
  let index = $state(0);
  let answers = $state<Record<string, AnswerData>>({});
  let direction = $state<'next' | 'prev'>('next');
  let submitting = $state(false);
  let instructionsOpen = $state(false);

  const attempt = $derived(attempts[viewed] ?? null);
  const hasInstructions = $derived(Boolean(exercise.description && exercise.description.replace(/<[^>]*>/g, '').trim()));
  const passed = $derived(attempt ? completesExercise(exercise, attempt) : false);
  const showPassedResult = $derived((exercise.completionPolicy ?? 'submitted') === 'passed' && attempt?.status === 'graded');
  const percent = (value: number) => Math.round(value * 10) / 10;
  const scorePercent = $derived(attempt && attempt.total > 0 ? percent((attempt.score / attempt.total) * 100) : 0);
  const progressValue = $derived(stage === 'finished' ? 100 : Math.round((index / models.length) * 100) || 0);

  function start() {
    stage = 'taking';
    index = 0;
    answers = {};
  }

  function onChange(answer: AnswerData | null) {
    const key = keyOf(index);
    const nextAnswers = { ...answers };

    if (answer === null) delete nextAnswers[key];
    else nextAnswers[key] = answer;
    answers = nextAnswers;
  }

  function previousQuestion() {
    direction = 'prev';
    index -= 1;
  }

  function nextQuestion(override?: AnswerData) {
    const key = keyOf(index);
    const value = override ?? answers[key];

    if (!hasAnswerValue(value)) {
      notify(t('course.navItem.lessons.exercises.all_exercises.view_mode.answer_required'), 'error');
      return;
    }

    answers = { ...answers, [key]: value as AnswerData };

    if (index === models.length - 1) {
      submit();
      return;
    }

    direction = 'next';
    index += 1;
  }

  function submit() {
    submitting = true;
    setTimeout(() => {
      const graded = autoGraded ? gradeAttempt(models, answers) : { grades: {}, score: 0, total: totalPoints };
      const created: Attempt = {
        id: `attempt-${Date.now()}`,
        at: Date.now(),
        answers,
        grades: graded.grades,
        score: graded.score,
        total: graded.total,
        status: autoGraded ? 'graded' : 'pending'
      };

      attempts = store.addAttempt(exercise.id, created);
      viewed = attempts.length - 1;
      stage = 'finished';
      submitting = false;

      if (completesExercise(exercise, created)) onComplete();
    }, 400);
  }

  function tryAgain() {
    start();
  }

  function pick(next: number) {
    viewed = next;
  }

  const answersByKey = $derived(attempt?.answers ?? {});
</script>

<Page.Root class="mx-auto flex w-full px-3 sm:w-[90%] sm:px-4 lg:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent><Page.Title>{exercise.title}</Page.Title></Page.HeaderContent>
    <Page.Action>
      {#if showPrevNext}
        <div class="flex items-center gap-1">
          <Button size="icon-sm" variant="outline" disabled={!previous} title={t('course.navItem.lessons.prev_shortcut')} aria-label={t('course.navItem.lessons.prev')} onclick={() => previous && onGo(previous.id)}>
            <ChevronLeftIcon size={14} />
          </Button>
          <Button size="icon-sm" variant="outline" disabled={!next || Boolean(next.locked)} title={t('course.navItem.lessons.next_shortcut')} aria-label={t('course.navItem.lessons.next')} onclick={() => next && onGo(next.id)}>
            <ChevronRightIcon size={14} />
          </Button>
        </div>
      {/if}
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="overflow-x-hidden pb-20">
        {#if locked}
          <Empty
            title={t('course.navItem.lessons.content_locked_title')}
            description={t('course.navItem.lessons.content_locked_description')}
            icon={LockIcon}
            variant="page"
            class="text-center"
          />
        {:else}
          {#if stage === 'taking'}
            <div class="mb-6 flex min-w-0 items-center gap-3">
              <span class="ui:text-muted-foreground shrink-0 text-sm tabular-nums">{index + 1}/{models.length}</span>
              <Progress class="min-w-0 flex-1" value={progressValue} />
              {#if hasInstructions}
                <Button type="button" variant="outline" size="sm" class="shrink-0" aria-pressed={instructionsOpen} onclick={() => (instructionsOpen = !instructionsOpen)}>
                  <InfoIcon />
                  {t('course.navItem.lessons.exercises.all_exercises.view_mode.instructions')}
                </Button>
              {/if}
            </div>
          {/if}

          <div class={stage === 'taking' && hasInstructions && instructionsOpen ? 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]' : ''}>
            <div class="min-w-0">
              {#if models.length === 0}
                <Empty title={t('course.navItem.lessons.exercises.all_exercises.view_mode.no_question')} icon={FileQuestionIcon} variant="page" />
              {:else if stage === 'start'}
                <div>
                  <h2 class="my-1">{exercise.title}</h2>
                  <div class="flex flex-wrap items-center">
                    <p class="mx-2"><strong>{models.length}</strong> {t('course.navItem.lessons.exercises.all_exercises.view_mode.questions')}</p>
                    |
                    <p class="mx-2"><strong>{totalPoints}</strong> {t('course.navItem.lessons.exercises.all_exercises.view_mode.points')}.</p>
                    |
                    <p class="mx-2">{t('course.navItem.lessons.exercises.all_exercises.view_mode.all')}</p>
                  </div>
                  <div class="preview prose prose-sm sm:prose mt-3 p-2">
                    {#if hasInstructions}
                      <SafeHtmlContent content={exercise.description ?? ''} />
                    {:else}
                      {t('course.navItem.lessons.exercises.all_exercises.view_mode.no_description')}
                    {/if}
                  </div>
                  <Button onclick={start} type="button" class="float-right my-5">
                    {t('course.navItem.lessons.exercises.all_exercises.view_mode.start')}
                  </Button>
                </div>
              {:else if stage === 'finished' && attempt}
                <div class="flex w-full flex-col items-start lg:flex-row lg:items-center lg:space-x-4">
                  {#if attempt.status === 'graded'}
                    <div class="mb-8 w-full space-y-2">
                      <Badge variant="success" title={t('course.navItem.lessons.exercises.all_exercises.view_mode.status_graded')}>
                        {t('course.navItem.lessons.exercises.all_exercises.view_mode.graded')}
                      </Badge>
                      <div class="flex w-full flex-col items-stretch gap-2 md:flex-row md:items-center">
                        <div class="flex shrink-0 flex-col justify-between gap-2 rounded-md border p-4">
                          <p><span class="text-2xl font-bold">{attempt.score}/</span><span class="text-xl">{attempt.total}</span></p>
                        </div>
                        {#if showPassedResult}
                          <Alert.Root variant={passed ? 'information' : 'warning'} class="h-fit! w-full! flex-1!">
                            <div class="col-start-2 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div class="min-w-0 space-y-1">
                                <p class="font-medium">
                                  {passed
                                    ? t('course.navItem.lessons.exercises.all_exercises.view_mode.passed_completion_result_title')
                                    : t('course.navItem.lessons.exercises.all_exercises.view_mode.not_passed_completion_result_title')}
                                </p>
                                <p class="ui:text-muted-foreground text-sm">
                                  {t(
                                    passed
                                      ? 'course.navItem.lessons.exercises.all_exercises.view_mode.passed_completion_result_description'
                                      : 'course.navItem.lessons.exercises.all_exercises.view_mode.not_passed_completion_result_description',
                                    { scorePercent: scorePercent, requiredPercent: exercise.passThreshold ?? 0 }
                                  )}
                                </p>
                              </div>
                              {#if allowMultiple && !passed}
                                <Button type="button" variant="outline" onclick={tryAgain} class="shrink-0">
                                  {t('course.navItem.lessons.exercises.all_exercises.view_mode.try_again')}
                                </Button>
                              {/if}
                            </div>
                          </Alert.Root>
                        {/if}
                      </div>
                    </div>
                  {:else if courseType === 'SELF_PACED' || courseType === 'COMPLIANCE'}
                    <Badge variant="success" title={t('course.navItem.lessons.exercises.all_exercises.view_mode.status_submitted')}>
                      {t('course.navItem.lessons.exercises.all_exercises.view_mode.submitted')}
                    </Badge>
                  {:else}
                    <Badge variant="warning" title={t('course.navItem.lessons.exercises.all_exercises.view_mode.status_pending')}>
                      {t('course.navItem.lessons.exercises.all_exercises.view_mode.pending')}
                    </Badge>
                  {/if}
                </div>

                {#if attempts.length > 1}
                  <div class="mb-4 flex flex-wrap items-center gap-2">
                    <IconButton disabled={viewed <= 0} onclick={() => pick(viewed - 1)} tooltip={t('course.navItem.lessons.exercises.all_exercises.view_mode.previous_try')}>
                      <ChevronLeftIcon class="h-4 w-4" />
                    </IconButton>
                    <span class="ui:text-muted-foreground text-sm">
                      {t('course.navItem.lessons.exercises.all_exercises.view_mode.attempt_counter', { current: viewed + 1, total: attempts.length })}
                    </span>
                    <IconButton disabled={viewed >= attempts.length - 1} onclick={() => pick(viewed + 1)} tooltip={t('course.navItem.lessons.exercises.all_exercises.view_mode.next_try')}>
                      <ChevronRightIcon class="h-4 w-4" />
                    </IconButton>
                  </div>
                {/if}

                {#each models as model, questionIndex (keyOf(questionIndex))}
                  {@const key = keyOf(questionIndex)}
                  <div class="mb-4 space-y-3">
                    {#if attempt.status === 'graded'}
                      <div class="flex items-center justify-between gap-2">
                        <NumberBadge number={questionIndex + 1} active />
                        <p class="flex items-center text-base"><span class="font-semibold">{attempt.grades[key] ?? 0}</span><span class="mx-1">/</span><span>{model.points}</span></p>
                      </div>
                    {/if}
                    <ExerciseQuestion.QuestionRenderer
                      contract={{ mode: 'review', question: model, answer: answersByKey[key], labels, disabled: true }}
                      questionNumber={questionIndex + 1}
                      questionNumberActive={false}
                    />
                  </div>
                {/each}

                {#if allowMultiple && !showPassedResult}
                  <div class="mt-4">
                    <Button type="button" variant="secondary" onclick={tryAgain}>
                      {t('course.navItem.lessons.exercises.all_exercises.view_mode.try_again')}
                    </Button>
                  </div>
                {/if}
              {:else if stage === 'taking'}
                <div class="flex min-w-0 flex-col gap-4">
                  <div class="grid overflow-hidden" style="grid-template-areas: 'slot';">
                    {#key index}
                      <div
                        id="question"
                        class="min-w-0 [grid-area:slot]"
                        in:fly={{ x: direction === 'next' ? 300 : -300, duration: 350, easing: cubicInOut }}
                        out:fly={{ x: direction === 'next' ? -300 : 300, duration: 350, easing: cubicInOut }}
                      >
                        <ExerciseQuestion.QuestionRenderer
                          contract={{ mode: 'take', question: models[index], answer: answers[keyOf(index)], labels, disabled: submitting }}
                          questionNumber={index + 1}
                          onAnswerChange={onChange}
                        />
                      </div>
                    {/key}
                  </div>
                  <div>
                    <ExerciseQuestion.QuestionNavigation
                      canGoBack={index > 0}
                      canGoNext={hasAnswerValue(answers[keyOf(index)]) && !submitting}
                      isLast={index === models.length - 1}
                      isSubmitting={submitting}
                      previousLabel={t('course.navItem.lessons.exercises.all_exercises.previous')}
                      nextLabel={t('course.navItem.lessons.exercises.all_exercises.next')}
                      finishLabel={t('course.navItem.lessons.exercises.all_exercises.finish')}
                      onPrevious={previousQuestion}
                      onNext={nextQuestion}
                    />
                  </div>
                </div>
              {/if}
            </div>

            {#if stage === 'taking' && hasInstructions && instructionsOpen}
              <aside class="sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col rounded-md border">
                <div class="flex items-center gap-2 border-b px-3 py-1">
                  <p class="min-w-0 flex-1 truncate text-sm font-semibold">{t('course.navItem.lessons.exercises.all_exercises.view_mode.instructions')}</p>
                  <IconButton onclick={() => (instructionsOpen = false)} tooltip={t('course.navItem.lessons.exercises.all_exercises.view_mode.close_instructions')} size="icon-xs">
                    <XIcon class="h-3.5 w-3.5" />
                  </IconButton>
                </div>
                <div class="preview prose prose-sm sm:prose overflow-y-auto p-4"><SafeHtmlContent content={exercise.description ?? ''} /></div>
              </aside>
            {/if}
          </div>
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
