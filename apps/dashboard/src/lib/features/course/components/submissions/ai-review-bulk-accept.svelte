<script lang="ts">
  import { aiReviewApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  interface Props {
    courseId: string;
    /** Exercises that have confident suggestions waiting, with how many. */
    countByExerciseId: Record<string, number>;
    onAccepted: () => void;
  }

  let { courseId, countByExerciseId, onAccepted }: Props = $props();

  let isAccepting = $state(false);

  const total = $derived(Object.values(countByExerciseId).reduce((sum, count) => sum + count, 0));

  async function acceptAll() {
    isAccepting = true;
    let acceptedCount = 0;

    for (const exerciseId of Object.keys(countByExerciseId)) {
      const result = await aiReviewApi.acceptConfident(courseId, exerciseId);
      acceptedCount += result?.acceptedCount ?? 0;
    }

    isAccepting = false;
    snackbar.success($t('ai_review.bulk_done', { count: acceptedCount }));
    onAccepted();
  }
</script>

{#if total > 0}
  <div
    class="ui:mb-3 ui:flex ui:items-center ui:justify-between ui:gap-3 ui:rounded-md ui:border ui:p-3"
    data-testid="ai-review-bulk"
  >
    <p class="ui:flex ui:items-center ui:gap-2 ui:text-sm">
      <SparklesIcon class="ui:size-4" />
      {$t('ai_review.bulk_hint', { count: total })}
    </p>
    <Button type="button" size="sm" loading={isAccepting} onclick={acceptAll} data-testid="ai-review-bulk-accept">
      {isAccepting ? $t('ai_review.bulk_accepting') : $t('ai_review.bulk_accept', { count: total })}
    </Button>
  </div>
{/if}
