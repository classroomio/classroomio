<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import { GRAPH_COLORS } from './graph-board-utils';

  interface Props {
    labels?: ExerciseQuestionLabels;
  }

  let { labels }: Props = $props();
</script>

<ul class="ui:text-muted-foreground ui:flex ui:flex-wrap ui:gap-4 ui:text-xs" data-testid="graph-legend">
  <li class="ui:flex ui:items-center ui:gap-1.5">
    <span
      class="ui:inline-block ui:h-0.5 ui:w-5"
      style:background={`linear-gradient(90deg, ${GRAPH_COLORS.correct} 50%, ${GRAPH_COLORS.wrong} 50%)`}
    ></span>
    {getMathQuestionLabel(labels, 'math.graph.review.student_legend')}
  </li>
  <li class="ui:flex ui:items-center ui:gap-1.5">
    <span
      class="ui:inline-block ui:h-0 ui:w-5 ui:border-t-2 ui:border-dashed"
      style:border-color={GRAPH_COLORS.expected}
    ></span>
    {getMathQuestionLabel(labels, 'math.graph.review.expected_legend')}
  </li>
</ul>
