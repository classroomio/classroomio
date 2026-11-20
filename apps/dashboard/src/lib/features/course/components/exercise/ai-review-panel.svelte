<script lang="ts">
  import { aiReviewApi } from '$features/course/api';
  import type { AiReviewData } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { formatPoints, getRubricVersion, readMarkingRubric, roundPoints, type AnswerData } from '@cio/question-types';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { MathText } from '@cio/ui/custom/math-text';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  interface Props {
    courseId: string;
    submissionId: string;
    question: { id: number; title: string; settings?: unknown };
    answer?: AnswerData;
    /** Points the grade field holds now; accepting adds the suggested working points to it. */
    currentPoints: number;
    /** True once this suggestion's points are in the grade field and waiting to be saved. */
    isApplied?: boolean;
    onApply: (points: number, review: AiReviewData) => void;
    onReject: (review: AiReviewData) => void;
    onReviewed: (review: AiReviewData) => void;
  }

  let {
    courseId,
    submissionId,
    question,
    answer,
    currentPoints,
    isApplied = false,
    onApply,
    onReject,
    onReviewed
  }: Props = $props();

  let requestedReview = $state<AiReviewData | null>(null);
  let isRequesting = $state(false);
  let baselinePoints = $state<number | null>(null);

  const review = $derived<AiReviewData | undefined>(requestedReview ?? answer?.aiReview);
  const rubric = $derived(readMarkingRubric(question.settings as Record<string, unknown> | undefined));
  const stepById = $derived(new Map(rubric.steps.map((step) => [step.id, step])));
  const isRubricChanged = $derived(Boolean(review && getRubricVersion(rubric) !== review.rubricVersion));
  const decisionStatus = $derived(review?.decision?.status);
  const isDecided = $derived(Boolean(decisionStatus) || isApplied);
  const confidencePercent = $derived(review ? Math.round(review.confidence * 100) : 0);

  async function requestSuggestion() {
    isRequesting = true;
    const result = await aiReviewApi.request(courseId, submissionId, Number(question.id));
    isRequesting = false;
    if (!result) return;

    requestedReview = result;
    onReviewed(result);
  }

  function accept() {
    if (!review) return;

    baselinePoints ??= currentPoints;
    onApply(roundPoints(baselinePoints + review.suggestedPoints), review);
  }
</script>

<div class="ui:space-y-3 ui:rounded-md ui:border ui:p-3" data-testid="ai-review-panel">
  <div class="ui:flex ui:items-start ui:justify-between ui:gap-2">
    <div class="ui:min-w-0 ui:space-y-1">
      <p class="ui:flex ui:items-center ui:gap-1 ui:text-sm ui:font-semibold">
        <SparklesIcon class="ui:size-4" />
        {$t('ai_review.title')}
      </p>
      <p class="ui:text-muted-foreground ui:truncate ui:text-xs"><MathText text={question.title} /></p>
    </div>
    {#if review}
      <Badge variant={review.confidence >= 0.85 ? 'success' : 'warning'} data-testid="ai-review-confidence">
        {$t('ai_review.confidence', { confidence: confidencePercent })}
      </Badge>
    {/if}
  </div>

  {#if !review}
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={isRequesting}
      onclick={requestSuggestion}
      data-testid="ai-review-request"
    >
      {isRequesting ? $t('ai_review.requesting') : $t('ai_review.request')}
    </Button>
  {:else}
    <ul class="ui:space-y-1 ui:text-sm" data-testid="ai-review-steps">
      {#each review.stepMarks as mark (mark.stepId)}
        <li class="ui:flex ui:items-start ui:justify-between ui:gap-2">
          <span class={review.firstWrongStep === mark.stepId ? 'ui:font-semibold' : ''}>
            {stepById.get(mark.stepId)?.description ?? mark.stepId}
            {#if mark.comment}
              <span class="ui:text-muted-foreground ui:block ui:text-xs">{mark.comment}</span>
            {/if}
          </span>
          <span class="ui:shrink-0 ui:font-mono">{formatPoints(mark.awarded)}/{formatPoints(mark.max)}</span>
        </li>
      {/each}
    </ul>

    {#if review.firstWrongStep && stepById.get(review.firstWrongStep)}
      <p class="ui:text-sm" data-testid="ai-review-first-wrong">
        {$t('ai_review.first_wrong_step', { step: stepById.get(review.firstWrongStep)?.description ?? '' })}
      </p>
    {/if}
    {#if review.comment}
      <p class="ui:text-sm">{review.comment}</p>
    {/if}
    {#if isRubricChanged}
      <p class="ui:text-destructive ui:text-xs">{$t('ai_review.rubric_changed')}</p>
    {/if}

    <p class="ui:text-muted-foreground ui:text-xs">
      {$t('ai_review.suggested_points', {
        points: formatPoints(review.suggestedPoints),
        max: formatPoints(review.maxPoints)
      })}
      · {$t('ai_review.model', { model: review.model })}
    </p>

    {#if decisionStatus}
      <Badge variant={decisionStatus === 'rejected' ? 'destructive' : 'success'} data-testid="ai-review-decision">
        {$t('ai_review.decision.' + decisionStatus)}
      </Badge>
    {:else}
      <p class="ui:text-muted-foreground ui:text-xs">{$t('ai_review.student_hidden')}</p>
      <div class="ui:flex ui:gap-2">
        <Button type="button" size="sm" disabled={isApplied} onclick={accept} data-testid="ai-review-accept">
          {isApplied ? $t('ai_review.applied') : $t('ai_review.accept')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isDecided}
          onclick={() => onReject(review)}
          data-testid="ai-review-reject"
        >
          {$t('ai_review.reject')}
        </Button>
      </div>
    {/if}
  {/if}
</div>
