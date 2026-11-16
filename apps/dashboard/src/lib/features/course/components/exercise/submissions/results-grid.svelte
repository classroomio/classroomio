<script lang="ts">
  import { ExerciseQuestion } from '@cio/ui';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as HoverCard from '@cio/ui/base/hover-card';
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';
  import { MathText } from '@cio/ui/custom/math-text';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import {
    describeClusterAnswer,
    formatPoints,
    getExerciseQuestionContractKey,
    getMultiPartStemIds,
    type AnswerData,
    type ExerciseQuestionModel
  } from '@cio/question-types';
  import { cn } from '@cio/ui/tools';

  import { exerciseResultsApi } from '$features/course/api';
  import type { ExerciseResultsCell, ExerciseResultsStudent } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { getExerciseQuestionLabels } from '../question-labels';
  import { toExerciseQuestionModel } from '../question-type-utils';
  import { getQuestionsForSection, questionnaire } from '../store';
  import AnswerClusters from './answer-clusters.svelte';

  interface Props {
    courseId: string;
    exerciseId: string;
  }

  type ResultsFilter = 'all' | 'wrong' | 'awaiting';

  const PAGE_SIZE = 25;
  const ALL_COHORTS = 'all';
  const FILTERS: ResultsFilter[] = ['all', 'wrong', 'awaiting'];
  const LEGEND: ExerciseResultsCell['state'][] = ['full', 'partial', 'wrong', 'awaiting', 'blank'];
  const CELL_CLASS: Record<ExerciseResultsCell['state'], string> = {
    full: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200',
    partial: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-200',
    wrong: 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-200',
    awaiting: 'bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-950/50 dark:text-sky-200',
    blank: 'ui:bg-muted ui:text-muted-foreground hover:bg-muted/70'
  };

  let { courseId, exerciseId }: Props = $props();

  let filter = $state<ResultsFilter>('all');
  let cohortId = $state(ALL_COHORTS);
  let page = $state(1);
  let clusterQuestionId = $state<number | null>(null);
  let reviewTarget = $state<{ student: ExerciseResultsStudent; cell: ExerciseResultsCell } | null>(null);
  let loadedOrgKey = '';

  const results = $derived(exerciseResultsApi.results);
  const labels = $derived(getExerciseQuestionLabels());
  const pageCount = $derived(results ? Math.max(1, Math.ceil(results.total / results.limit)) : 1);

  const gridQuestions = $derived.by(() => {
    const activeQuestions = $questionnaire.questions.filter((question) => !question.deletedAt);
    const stemIds = getMultiPartStemIds(
      activeQuestions.map((question) => ({
        id: Number(question.id),
        parentQuestionId: question.parentQuestionId == null ? null : Number(question.parentQuestionId)
      }))
    );
    const activeSections = [...($questionnaire.sections ?? [])]
      .filter((section) => !section.deletedAt)
      .sort((a, b) => a.order - b.order);
    const sectioned = activeSections.flatMap((section) => getQuestionsForSection(activeQuestions, section.id));
    const sectionedIds = new Set(sectioned.map((question) => question.id));
    const unsectioned = activeQuestions.filter((question) => !sectionedIds.has(question.id));

    return [...sectioned, ...unsectioned]
      .filter((question) => !stemIds.has(Number(question.id)))
      .map((question) => ({ question, model: toExerciseQuestionModel(question), id: Number(question.id) }));
  });

  $effect(() => {
    const requestKey = [courseId, exerciseId, filter, cohortId, page].join('|');
    if (!courseId || !exerciseId || requestKey === loadedOrgKey) return;

    loadedOrgKey = requestKey;
    void exerciseResultsApi.load(courseId, exerciseId, {
      page,
      limit: PAGE_SIZE,
      filter,
      cohortId: cohortId === ALL_COHORTS ? undefined : cohortId
    });
  });

  function chooseFilter(next: ResultsFilter) {
    filter = next;
    page = 1;
  }

  function chooseCohort(next: string) {
    cohortId = next;
    page = 1;
  }

  function findCell(student: ExerciseResultsStudent, questionId: number) {
    return student.cells.find((cell) => cell.questionId === questionId);
  }

  async function previewText(model: ExerciseQuestionModel, answer: AnswerData): Promise<string> {
    if (!answer.seed) return describeClusterAnswer(model, answer);

    const { instantiateQuestion } = await import('@cio/question-types/variants');

    return describeClusterAnswer(instantiateQuestion(model, answer.seed), answer);
  }

  function reviewContract(target: { student: ExerciseResultsStudent; cell: ExerciseResultsCell }) {
    const model = gridQuestions.find((entry) => entry.id === target.cell.questionId)!.model;
    const key = getExerciseQuestionContractKey(model, 0);

    return {
      mode: 'review' as const,
      questions: [model],
      answersByKey: target.cell.answer ? { [key]: target.cell.answer } : {},
      scoresByKey: { [key]: target.cell.points },
      labels,
      disabled: true
    };
  }

  function stateLabel(state: ExerciseResultsCell['state']) {
    return $t(`exercise_results.state.${state}`);
  }
</script>

<div class="flex flex-col gap-4" data-testid="results-grid">
  <div class="flex flex-wrap items-center gap-2">
    {#each FILTERS as option (option)}
      <Button
        size="sm"
        variant={filter === option ? 'default' : 'outline'}
        onclick={() => chooseFilter(option)}
        data-testid={`results-filter-${option}`}
      >
        {$t(`exercise_results.filter.${option}`)}
      </Button>
    {/each}

    {#if results && results.cohorts.length > 0}
      <Select.Root type="single" value={cohortId} onValueChange={chooseCohort}>
        <Select.Trigger class="w-48" data-testid="results-cohort-filter">
          {results.cohorts.find((cohort) => cohort.id === cohortId)?.name ?? $t('exercise_results.filter.all_cohorts')}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={ALL_COHORTS}>{$t('exercise_results.filter.all_cohorts')}</Select.Item>
          {#each results.cohorts as cohort (cohort.id)}
            <Select.Item value={cohort.id}>{cohort.name}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    {/if}

    <div class="ml-auto flex flex-wrap items-center gap-3 text-xs">
      {#each LEGEND as state (state)}
        <span class="flex items-center gap-1">
          <span class={cn('inline-block size-3 rounded-sm border', CELL_CLASS[state])}></span>
          {stateLabel(state)}
        </span>
      {/each}
    </div>
  </div>

  {#if !results}
    <Spinner />
  {:else if results.students.length === 0}
    <p class="ui:text-muted-foreground py-8 text-center text-sm">{$t('exercise_results.empty')}</p>
  {:else}
    <div class="relative max-h-[70vh] overflow-auto rounded-md border" data-testid="results-grid-scroll">
      <table class="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th class="ui:bg-background sticky top-0 left-0 z-30 min-w-48 border-r border-b p-2 text-left font-medium">
              {$t('exercise_results.student')}
            </th>
            {#each gridQuestions as entry, index (entry.id)}
              <th class="ui:bg-background sticky top-0 z-20 min-w-24 border-b p-1 text-center font-medium">
                <button
                  type="button"
                  class="hover:bg-muted w-full rounded px-2 py-1"
                  title={entry.model.title}
                  onclick={() => (clusterQuestionId = entry.id)}
                  data-testid={`results-question-header-${entry.id}`}
                >
                  <span class="block">{$t('exercise_results.question_short', { number: index + 1 })}</span>
                  <span class="ui:text-muted-foreground block text-xs font-normal">
                    {formatPoints(entry.model.points)}
                    {$t('exercise_results.points_short')}
                  </span>
                </button>
              </th>
            {/each}
            <th
              class="ui:bg-background sticky top-0 right-0 z-30 min-w-24 border-b border-l p-2 text-center font-medium"
            >
              {$t('exercise_results.total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each results.students as student (student.submissionId)}
            <tr data-testid="results-row">
              <th class="ui:bg-background sticky left-0 z-10 border-r border-b p-2 text-left font-normal">
                <div class="flex items-center gap-2">
                  <UserAvatar avatarUrl={student.avatarUrl ?? ''} name={student.fullname ?? ''} className="size-6" />
                  <span class="truncate">{student.fullname ?? $t('exercise_results.unknown_student')}</span>
                </div>
              </th>
              {#each gridQuestions as entry (entry.id)}
                {@const cell = findCell(student, entry.id)}
                <td class="border-b p-1 text-center">
                  {#if cell}
                    <HoverCard.Root openDelay={150}>
                      <HoverCard.Trigger>
                        {#snippet child({ props })}
                          <button
                            {...props}
                            type="button"
                            class={cn('w-full rounded px-2 py-1.5 font-medium', CELL_CLASS[cell.state])}
                            data-testid="results-cell"
                            data-state={cell.state}
                            onclick={() => (reviewTarget = { student, cell })}
                          >
                            {cell.state === 'blank' ? '–' : formatPoints(cell.points)}
                          </button>
                        {/snippet}
                      </HoverCard.Trigger>
                      <HoverCard.Content class="w-72" data-testid="results-cell-preview">
                        <p class="ui:text-muted-foreground mb-1 text-xs">
                          {student.fullname} · {stateLabel(cell.state)}
                        </p>
                        {#if cell.answer}
                          {#await previewText(entry.model, cell.answer) then text}
                            <div class="text-base"><MathText {text} /></div>
                          {/await}
                        {:else}
                          <p class="ui:text-muted-foreground text-sm">{$t('exercise_results.no_answer')}</p>
                        {/if}
                      </HoverCard.Content>
                    </HoverCard.Root>
                  {/if}
                </td>
              {/each}
              <td class="ui:bg-background sticky right-0 z-10 border-b border-l p-2 text-center font-semibold">
                {formatPoints(student.total)} / {formatPoints(results.totalPoints)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between text-sm">
      <span class="ui:text-muted-foreground">{$t('exercise_results.page', { page, pages: pageCount })}</span>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onclick={() => (page -= 1)}>
          {$t('exercise_results.previous')}
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pageCount} onclick={() => (page += 1)}>
          {$t('exercise_results.next')}
        </Button>
      </div>
    </div>
  {/if}
</div>

<Dialog.Root
  open={reviewTarget !== null}
  onOpenChange={(isOpen) => {
    if (!isOpen) reviewTarget = null;
  }}
>
  <Dialog.Content class="max-h-[85vh] max-w-2xl overflow-y-auto">
    {#if reviewTarget}
      <Dialog.Header>
        <Dialog.Title>{reviewTarget.student.fullname}</Dialog.Title>
        <Dialog.Description>{stateLabel(reviewTarget.cell.state)}</Dialog.Description>
      </Dialog.Header>
      <ExerciseQuestion.QuestionList contract={reviewContract(reviewTarget)} />
    {/if}
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root
  open={clusterQuestionId !== null}
  onOpenChange={(isOpen) => {
    if (isOpen) return;

    clusterQuestionId = null;
    loadedOrgKey = '';
  }}
>
  <Dialog.Content class="max-h-[85vh] max-w-3xl overflow-y-auto">
    {#if clusterQuestionId !== null}
      {@const clusterEntry = gridQuestions.find((entry) => entry.id === clusterQuestionId)}
      <Dialog.Header>
        <Dialog.Title>{$t('exercise_results.clusters.title')}</Dialog.Title>
        <Dialog.Description>
          {#if clusterEntry}<MathText text={clusterEntry.model.title} />{/if}
        </Dialog.Description>
      </Dialog.Header>
      <AnswerClusters {courseId} {exerciseId} questionId={clusterQuestionId} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
