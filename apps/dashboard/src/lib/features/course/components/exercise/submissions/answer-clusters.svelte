<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Textarea } from '@cio/ui/base/textarea';
  import { MathText } from '@cio/ui/custom/math-text';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { formatPoints } from '@cio/question-types';

  import { AssignPracticeDialog } from '$features/practice/components';
  import { exerciseResultsApi } from '$features/course/api';
  import type { AnswerClusterItem } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    exerciseId: string;
    questionId: number;
  }

  type EditMode = 'partial' | 'feedback';

  let { courseId, exerciseId, questionId }: Props = $props();

  let editingKey = $state<string | null>(null);
  let editMode = $state<EditMode>('partial');
  let pointsDraft = $state<number | null>(null);
  let feedbackDraft = $state('');
  let isSaving = $state(false);
  let loadedQuestionId = -1;
  let practiceStudents = $state<{ profileId: string; name: string }[]>([]);
  let isPracticeOpen = $state(false);

  const data = $derived(exerciseResultsApi.clusters);

  $effect(() => {
    if (loadedQuestionId === questionId) return;

    loadedQuestionId = questionId;
    editingKey = null;
    void exerciseResultsApi.loadClusters(courseId, exerciseId, questionId);
  });

  async function apply(
    cluster: AnswerClusterItem,
    change: { verdict?: 'correct' | 'partial' | 'wrong'; points?: number; feedback?: string }
  ) {
    isSaving = true;
    const verdict = change.verdict ?? cluster.override?.verdict;
    const body = {
      key: cluster.key,
      verdict,
      points: verdict === 'partial' ? (change.points ?? cluster.override?.points) : undefined,
      feedback: change.feedback ?? cluster.override?.feedback
    };
    const changed = await exerciseResultsApi.setOverride(courseId, exerciseId, questionId, body);
    isSaving = false;
    if (changed !== null) editingKey = null;
  }

  async function undo(cluster: AnswerClusterItem) {
    isSaving = true;
    await exerciseResultsApi.resetOverride(courseId, exerciseId, questionId, cluster.key);
    isSaving = false;
  }

  function openEditor(cluster: AnswerClusterItem, mode: EditMode) {
    editingKey = cluster.key;
    editMode = mode;
    pointsDraft = cluster.override?.points ?? null;
    feedbackDraft = cluster.override?.feedback ?? '';
  }

  function openPractice(cluster: AnswerClusterItem) {
    practiceStudents = cluster.studentIds.flatMap((profileId, index) =>
      profileId ? [{ profileId, name: cluster.studentNames[index] ?? '' }] : []
    );
    isPracticeOpen = true;
  }

  function gradeVariant(grade: AnswerClusterItem['grade']) {
    if (grade === 'full') return 'success';
    if (grade === 'wrong') return 'destructive';

    return 'warning';
  }

  function decisionText(cluster: AnswerClusterItem) {
    const verdict = cluster.override?.verdict;
    if (verdict === 'correct') return $t('exercise_results.clusters.decision_correct');
    if (verdict === 'wrong') return $t('exercise_results.clusters.decision_wrong');
    if (verdict === 'partial') {
      return $t('exercise_results.clusters.decision_partial', { points: formatPoints(cluster.override?.points) });
    }

    return $t('exercise_results.clusters.decision_feedback');
  }
</script>

<div class="flex flex-col gap-3" data-testid="answer-clusters">
  {#if !data}
    <Spinner />
  {:else if data.clusters.length === 0}
    <p class="ui:text-muted-foreground py-6 text-center text-sm">{$t('exercise_results.clusters.empty')}</p>
  {:else}
    {#if data.isParameterised}
      <p class="ui:text-muted-foreground text-xs">{$t('exercise_results.clusters.parameterised_hint')}</p>
    {/if}
    {#if !data.canScore}
      <p class="ui:text-muted-foreground text-xs">{$t('exercise_results.clusters.not_scorable')}</p>
    {/if}

    {#each data.clusters as cluster (cluster.key)}
      <div class="flex flex-col gap-2 rounded-md border p-3" data-testid="answer-cluster">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="min-w-0 text-lg" data-testid="answer-cluster-label"><MathText text={cluster.label} /></div>
          <div class="flex items-center gap-2">
            <Badge variant="outline" data-testid="answer-cluster-count">
              {$t('exercise_results.clusters.count', { count: cluster.count })}
            </Badge>
            <Badge variant={gradeVariant(cluster.grade)}>
              {$t(`exercise_results.clusters.grade.${cluster.grade}`)}
              {#if cluster.points !== null}· {formatPoints(cluster.points)}{/if}
            </Badge>
          </div>
        </div>

        <p class="ui:text-muted-foreground text-xs" title={cluster.studentNames.join(', ')}>
          {cluster.studentNames.slice(0, 6).join(', ')}{cluster.studentNames.length > 6 ? '…' : ''}
        </p>

        {#if cluster.override}
          <p class="text-xs font-medium" data-testid="answer-cluster-decision">
            {decisionText(cluster)}
            {#if cluster.override.feedback}· {$t('exercise_results.clusters.has_feedback')}{/if}
          </p>
        {/if}

        <div class="flex flex-wrap gap-2">
          {#if data.canScore}
            <Button
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onclick={() => apply(cluster, { verdict: 'correct' })}
              testId="cluster-mark-correct"
            >
              {$t('exercise_results.clusters.mark_correct')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onclick={() => openEditor(cluster, 'partial')}
              testId="cluster-mark-partial"
            >
              {$t('exercise_results.clusters.mark_partial')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isSaving}
              onclick={() => apply(cluster, { verdict: 'wrong' })}
              testId="cluster-mark-wrong"
            >
              {$t('exercise_results.clusters.mark_wrong')}
            </Button>
          {/if}
          <Button
            size="sm"
            variant="outline"
            disabled={isSaving}
            onclick={() => openEditor(cluster, 'feedback')}
            testId="cluster-add-feedback"
          >
            {$t('exercise_results.clusters.add_feedback')}
          </Button>
          {#if cluster.grade !== 'full' && cluster.studentIds.some(Boolean)}
            <Button size="sm" variant="outline" onclick={() => openPractice(cluster)} testId="cluster-assign-practice">
              {$t('practice.actions.assign_to_cluster', { count: cluster.studentIds.filter(Boolean).length })}
            </Button>
          {/if}
          {#if cluster.override}
            <Button size="sm" variant="outline" disabled={isSaving} onclick={() => undo(cluster)} testId="cluster-undo">
              {$t('exercise_results.clusters.undo')}
            </Button>
          {/if}
        </div>

        {#if editingKey === cluster.key && editMode === 'partial'}
          <div class="flex items-end gap-2">
            <NumberField
              bind:value={pointsDraft}
              min={0}
              max={data.points}
              step={0.25}
              label={$t('exercise_results.clusters.points_label', { max: formatPoints(data.points) })}
              testId="cluster-points-input"
            />
            <Button
              size="sm"
              disabled={isSaving || pointsDraft === null}
              onclick={() => apply(cluster, { verdict: 'partial', points: pointsDraft ?? 0 })}
              testId="cluster-apply-partial"
            >
              {$t('exercise_results.clusters.apply')}
            </Button>
          </div>
        {/if}

        {#if editingKey === cluster.key && editMode === 'feedback'}
          <div class="flex flex-col gap-2">
            <Textarea
              bind:value={feedbackDraft}
              rows={3}
              placeholder={$t('exercise_results.clusters.feedback_placeholder')}
              data-testid="cluster-feedback-input"
            />
            <div>
              <Button
                size="sm"
                disabled={isSaving || (!feedbackDraft.trim() && !cluster.override?.verdict)}
                onclick={() => apply(cluster, { feedback: feedbackDraft.trim() })}
                testId="cluster-save-feedback"
              >
                {$t('exercise_results.clusters.save_feedback')}
              </Button>
            </div>
          </div>
        {/if}
      </div>
    {/each}

    {#if data.blank > 0}
      <p class="ui:text-muted-foreground text-xs">{$t('exercise_results.clusters.blank', { count: data.blank })}</p>
    {/if}
  {/if}
</div>

<AssignPracticeDialog
  bind:open={isPracticeOpen}
  {courseId}
  students={practiceStudents}
  source={{ sourceQuestionIds: [questionId] }}
  defaultTitle={$t('practice.default_title_question')}
/>
