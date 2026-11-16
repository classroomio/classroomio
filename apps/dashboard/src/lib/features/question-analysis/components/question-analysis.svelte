<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Spinner } from '@cio/ui/base/spinner';
  import { MathText } from '@cio/ui/custom/math-text';
  import { ITEM_ANALYSIS_THRESHOLDS } from '@cio/question-types/item-analysis';

  import { questionAnalysisApi } from '$features/question-analysis/api';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    exerciseId: string;
  }

  let { courseId, exerciseId }: Props = $props();

  let loadedKey = '';

  const rows = $derived(questionAnalysisApi.rows);

  $effect(() => {
    const requestKey = [courseId, exerciseId].join('|');
    if (!courseId || !exerciseId || requestKey === loadedKey) return;

    loadedKey = requestKey;
    void questionAnalysisApi.load(courseId, exerciseId);
  });
</script>

<div class="flex flex-col gap-3" data-testid="question-analysis">
  <p class="ui:text-muted-foreground text-sm">
    {$t('question_analysis.description', {
      hard: ITEM_ANALYSIS_THRESHOLDS.tooHardBelow,
      easy: ITEM_ANALYSIS_THRESHOLDS.tooEasyAbove,
      discrimination: ITEM_ANALYSIS_THRESHOLDS.poorDiscriminationBelow
    })}
  </p>

  {#if !rows}
    <Spinner />
  {:else if rows.length === 0}
    <p class="ui:text-muted-foreground py-8 text-center text-sm">{$t('question_analysis.empty')}</p>
  {:else}
    <div class="overflow-x-auto rounded-md border">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="border-b text-left">
            <th class="p-2 font-medium">{$t('question_analysis.columns.question')}</th>
            <th class="p-2 text-right font-medium">{$t('question_analysis.columns.facility')}</th>
            <th class="p-2 text-right font-medium">{$t('question_analysis.columns.discrimination')}</th>
            <th class="p-2 text-right font-medium">{$t('question_analysis.columns.time')}</th>
            <th class="p-2 font-medium">{$t('question_analysis.columns.wrong_answers')}</th>
            <th class="p-2 font-medium">{$t('question_analysis.columns.flags')}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.questionId)}
            <tr class="border-b align-top" data-testid="question-analysis-row">
              <td class="max-w-64 p-2"><MathText text={row.title} /></td>
              <td class="p-2 text-right" data-testid="question-analysis-facility">
                {row.facility === null ? '–' : `${row.facility}%`}
              </td>
              <td class="p-2 text-right" data-testid="question-analysis-discrimination">
                {row.discrimination === null ? '–' : row.discrimination}
              </td>
              <td class="p-2 text-right">
                {row.medianSeconds === null
                  ? '–'
                  : $t('question_analysis.seconds', { seconds: Math.round(row.medianSeconds) })}
              </td>
              <td class="p-2">
                {#if row.wrongAnswers.length === 0}
                  <span class="ui:text-muted-foreground">–</span>
                {:else}
                  <ul class="flex flex-col gap-1">
                    {#each row.wrongAnswers as wrong (wrong.label)}
                      <li class="flex items-center gap-2">
                        <MathText text={wrong.label} />
                        <Badge variant="outline">{wrong.count}</Badge>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </td>
              <td class="p-2">
                <div class="flex flex-wrap gap-1">
                  {#each row.flags as flag (flag)}
                    <Badge
                      variant={flag === 'poor_discrimination' ? 'warning' : 'destructive'}
                      data-testid="question-analysis-flag"
                    >
                      {$t(`question_analysis.flags.${flag}`)}
                    </Badge>
                  {/each}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
