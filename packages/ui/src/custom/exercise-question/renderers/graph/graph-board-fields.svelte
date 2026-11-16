<script lang="ts">
  import {
    getMathQuestionLabel,
    readGraphBoardSettings,
    type ExerciseQuestionLabels,
    type MathQuestionLabelKey
  } from '@cio/question-types';
  import { Checkbox } from '../../../../base/checkbox';
  import { Input } from '../../../../base/input';
  import { Label } from '../../../../base/label';
  import { NumberField } from '../../../number-field';

  interface Props {
    settings: Record<string, unknown> | undefined;
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onPatchSettings: (patch: Record<string, unknown>) => void;
  }

  let { settings, labels, disabled = false, onPatchSettings }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const board = $derived(readGraphBoardSettings(settings?.board));
  const rawBoard = $derived((settings?.board ?? {}) as Record<string, unknown>);

  const RANGE_FIELDS = [
    { key: 'xMin', label: 'math.graph.edit.x_min' },
    { key: 'xMax', label: 'math.graph.edit.x_max' },
    { key: 'yMin', label: 'math.graph.edit.y_min' },
    { key: 'yMax', label: 'math.graph.edit.y_max' }
  ] as const;

  function patchBoard(patch: Record<string, unknown>) {
    onPatchSettings({ board: { ...board, ...rawBoard, ...patch } });
  }

  const isRangeInvalid = $derived(
    typeof rawBoard.xMin === 'number' &&
      typeof rawBoard.xMax === 'number' &&
      typeof rawBoard.yMin === 'number' &&
      typeof rawBoard.yMax === 'number' &&
      (rawBoard.xMin >= rawBoard.xMax || rawBoard.yMin >= rawBoard.yMax)
  );
</script>

<div class="ui:space-y-3" data-testid="graph-board-fields">
  <div class="ui:grid ui:grid-cols-2 ui:gap-3 ui:md:grid-cols-4">
    {#each RANGE_FIELDS as field (field.key)}
      <div class="ui:space-y-1">
        <Label>{label(field.label)}</Label>
        <NumberField
          value={typeof rawBoard[field.key] === 'number' ? (rawBoard[field.key] as number) : board[field.key]}
          isDisabled={disabled}
          testId={`graph-${field.key}`}
          onValueChange={(next) => next !== null && patchBoard({ [field.key]: next })}
        />
      </div>
    {/each}
  </div>
  {#if isRangeInvalid}
    <p class="ui:text-destructive ui:text-xs" role="alert">{label('math.graph.edit.range_invalid')}</p>
  {/if}

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <Label>{label('math.graph.edit.x_label')}</Label>
      <Input
        {disabled}
        maxlength={20}
        value={board.xLabel}
        oninput={(event) => patchBoard({ xLabel: event.currentTarget.value })}
      />
    </div>
    <div class="ui:space-y-1">
      <Label>{label('math.graph.edit.y_label')}</Label>
      <Input
        {disabled}
        maxlength={20}
        value={board.yLabel}
        oninput={(event) => patchBoard({ yLabel: event.currentTarget.value })}
      />
    </div>
  </div>

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <Label>{label('math.graph.edit.snap_label')}</Label>
      <NumberField
        value={board.snap}
        min={0}
        isDisabled={disabled}
        testId="graph-snap"
        onValueChange={(next) => next !== null && patchBoard({ snap: next })}
      />
      <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.edit.snap_helper')}</p>
    </div>
    <div class="ui:flex ui:items-center ui:gap-2 ui:self-end ui:pb-2">
      <Checkbox {disabled} checked={board.grid} onCheckedChange={(checked) => patchBoard({ grid: checked === true })} />
      <Label>{label('math.graph.edit.show_grid')}</Label>
    </div>
  </div>
</div>
