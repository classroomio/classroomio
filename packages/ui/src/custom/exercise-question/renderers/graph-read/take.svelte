<script lang="ts">
  import { getMathQuestionLabel, readGraphReadSettings, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Label } from '../../../../base/label';
  import { NumberField } from '../../../number-field';
  import GraphBoard from '../graph/graph-board.svelte';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getMathQuestionLabel>[1]) => getMathQuestionLabel(labels, key);

  const settings = $derived(readGraphReadSettings(question.settings));
  const kind = $derived(settings.answer?.kind ?? 'value');
  const storedValue = $derived(answer?.type === 'GRAPH_READ' ? (answer.value ?? null) : null);
  const storedPoint = $derived(answer?.type === 'GRAPH_READ' ? answer.point : undefined);

  let draftX = $state<number | null>(null);
  let draftY = $state<number | null>(null);
  const pointX = $derived(draftX ?? storedPoint?.x ?? null);
  const pointY = $derived(draftY ?? storedPoint?.y ?? null);

  function changeValue(next: number | null) {
    onAnswerChange(next === null ? null : { type: 'GRAPH_READ', value: next });
  }

  function changePoint(x: number | null, y: number | null) {
    draftX = x;
    draftY = y;
    onAnswerChange(x === null || y === null ? null : { type: 'GRAPH_READ', point: { x, y } });
  }
</script>

<div class="ui:space-y-3" data-testid="graph-read-take">
  <GraphBoard board={settings.board} curves={settings.curves} markedPoints={settings.points} {labels} />
  {#if kind === 'value'}
    <div class="ui:max-w-xs ui:space-y-1">
      <Label>{label('math.graph.take.read.value_label')}</Label>
      <NumberField
        value={storedValue}
        isDisabled={disabled}
        allowEmpty
        testId="graph-read-value"
        placeholder={label('math.graph.take.read.value_placeholder')}
        onValueChange={changeValue}
      />
    </div>
  {:else}
    <div class="ui:grid ui:max-w-md ui:grid-cols-2 ui:gap-3">
      <div class="ui:space-y-1">
        <Label>{label('math.graph.take.read.x_label')}</Label>
        <NumberField
          value={pointX}
          isDisabled={disabled}
          allowEmpty
          testId="graph-read-x"
          onValueChange={(next) => changePoint(next, pointY)}
        />
      </div>
      <div class="ui:space-y-1">
        <Label>{label('math.graph.take.read.y_label')}</Label>
        <NumberField
          value={pointY}
          isDisabled={disabled}
          allowEmpty
          testId="graph-read-y"
          onValueChange={(next) => changePoint(pointX, next)}
        />
      </div>
    </div>
  {/if}
</div>
