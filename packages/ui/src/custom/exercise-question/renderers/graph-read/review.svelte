<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getMathQuestionLabel,
    gradeGraphRead,
    readGraphReadSettings,
    type ExerciseQuestionRendererProps,
    type PlotElement
  } from '@cio/question-types';
  import GraphBoard from '../graph/graph-board.svelte';
  import GraphGradeResult from '../graph/graph-grade-result.svelte';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readGraphReadSettings(question.settings));
  const readAnswer = $derived(answer?.type === 'GRAPH_READ' ? answer : { type: 'GRAPH_READ' as const });
  const grade = $derived(gradeGraphRead(settings, readAnswer));
  const reason = $derived(answer?.type === 'GRAPH_READ' ? (answer.grading?.reason ?? grade.reason) : grade.reason);
  const key = $derived(settings.answer);
  const studentText = $derived(
    readAnswer.point
      ? `(${readAnswer.point.x}, ${readAnswer.point.y})`
      : readAnswer.value !== undefined
        ? String(readAnswer.value)
        : getExerciseQuestionLabel(labels, 'common.not_set')
  );
  const expectedText = $derived(!key ? '' : key.kind === 'value' ? String(key.value) : `(${key.x}, ${key.y})`);
  const studentElements = $derived<PlotElement[]>(
    readAnswer.point ? [{ kind: 'point', x: readAnswer.point.x, y: readAnswer.point.y }] : []
  );
  const expectedElements = $derived<PlotElement[]>(
    key?.kind === 'point' ? [{ kind: 'point', x: key.x, y: key.y }] : []
  );
</script>

<div class="ui:space-y-2">
  <GraphBoard
    board={settings.board}
    curves={settings.curves}
    markedPoints={settings.points}
    elements={studentElements}
    expected={expectedElements}
    matches={studentElements.length > 0 ? [grade.reason === 'correct'] : undefined}
    {labels}
  />
  <LabeledValueRow label={getMathQuestionLabel(labels, 'math.review.your_answer')} value={studentText} />
  {#if expectedText}
    <LabeledValueRow label={getMathQuestionLabel(labels, 'math.graph.review.expected_read')} value={expectedText} />
  {/if}
  <GraphGradeResult {reason} {labels} />
</div>
