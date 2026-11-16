<script lang="ts">
  import { gradeGraphPlot, readGraphPlotSettings, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import GraphBoard from '../graph/graph-board.svelte';
  import GraphGradeResult from '../graph/graph-grade-result.svelte';
  import GraphLegend from '../graph/graph-legend.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readGraphPlotSettings(question.settings));
  const elements = $derived(answer?.type === 'GRAPH_PLOT' ? answer.elements : []);
  const grade = $derived(gradeGraphPlot(settings, elements));
  const matches = $derived(elements.map((_, index) => grade.matches.some((match) => match.studentIndex === index)));
  const reason = $derived(answer?.type === 'GRAPH_PLOT' ? (answer.grading?.reason ?? grade.reason) : grade.reason);
</script>

<div class="ui:space-y-2">
  <GraphBoard board={settings.board} {elements} expected={settings.expected} {matches} {labels} />
  <GraphLegend {labels} />
  <GraphGradeResult {reason} matched={grade.matched} total={grade.total} showCount {labels} />
</div>
