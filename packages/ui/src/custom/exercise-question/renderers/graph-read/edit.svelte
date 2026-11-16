<script lang="ts">
  import {
    getMathQuestionLabel,
    readGraphReadSettings,
    type ExerciseQuestionRendererProps,
    type GraphReadKey
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { Label } from '../../../../base/label';
  import * as Select from '../../../../base/select';
  import { IconButton } from '../../../icon-button';
  import { MathInput } from '../../../math-input';
  import { NumberField } from '../../../number-field';
  import GraphBoard from '../graph/graph-board.svelte';
  import GraphBoardFields from '../graph/graph-board-fields.svelte';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getMathQuestionLabel>[1]) => getMathQuestionLabel(labels, key);

  const settings = $derived(readGraphReadSettings(question.settings));
  const rawCurves = $derived(
    Array.isArray(question.settings?.curves) ? (question.settings.curves as Array<Record<string, unknown>>) : []
  );
  const rawPoints = $derived(
    Array.isArray(question.settings?.points) ? (question.settings.points as Array<Record<string, unknown>>) : []
  );
  const answer = $derived(settings.answer);
  const answerKind = $derived(answer?.kind ?? 'value');
  const rawAnswer = $derived((question.settings?.answer ?? {}) as Record<string, unknown>);

  function patchSettings(patch: Record<string, unknown>) {
    onQuestionChange({ ...question, settings: { ...(question.settings ?? {}), ...patch } });
  }

  function patchAnswer(patch: Record<string, unknown>) {
    patchSettings({ answer: { kind: answerKind, tolerance: answer?.tolerance, ...rawAnswer, ...patch } });
  }

  function changeAnswerKind(kind: GraphReadKey['kind']) {
    patchSettings({ answer: { kind, tolerance: answer?.tolerance ?? 0.1 } });
  }

  function patchCurve(index: number, patch: Record<string, unknown>) {
    patchSettings({
      curves: rawCurves.map((curve, curveIndex) => (curveIndex === index ? { ...curve, ...patch } : curve))
    });
  }

  function patchPoint(index: number, patch: Record<string, unknown>) {
    patchSettings({
      points: rawPoints.map((point, pointIndex) => (pointIndex === index ? { ...point, ...patch } : point))
    });
  }
</script>

<div class="ui:space-y-5" data-testid="graph-read-edit">
  <div class="ui:space-y-3">
    <p class="ui:text-sm ui:font-medium">{label('math.graph.edit.board_heading')}</p>
    <GraphBoardFields settings={question.settings} {labels} {disabled} onPatchSettings={patchSettings} />
  </div>

  <div class="ui:space-y-2">
    <Label>{label('math.graph.read.curves_label')}</Label>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.read.curves_helper')}</p>
    {#each rawCurves as curve, index (index)}
      <div class="ui:flex ui:items-center ui:gap-2" data-testid="graph-curve-row">
        <MathInput
          class="ui:flex-1"
          keyboard="algebra"
          {disabled}
          value={String(curve.expression ?? '')}
          placeholder={label('math.graph.read.curve_placeholder')}
          ariaLabel={label('math.graph.read.curves_label')}
          onInput={({ latex }) => patchCurve(index, { expression: latex })}
        />
        <Input
          class="ui:w-40"
          {disabled}
          maxlength={40}
          value={String(curve.label ?? '')}
          placeholder={label('math.graph.read.curve_label_placeholder')}
          oninput={(event) => patchCurve(index, { label: event.currentTarget.value })}
        />
        <IconButton
          type="button"
          variant="secondary"
          {disabled}
          tooltip={label('math.graph.read.remove')}
          onclick={() => patchSettings({ curves: rawCurves.filter((_, curveIndex) => curveIndex !== index) })}
        >
          <XIcon class="ui:size-4" />
        </IconButton>
      </div>
    {/each}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled || rawCurves.length >= 6}
      data-testid="graph-add-curve"
      onclick={() => patchSettings({ curves: [...rawCurves, { expression: '' }] })}
    >
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('math.graph.read.add_curve')}
    </Button>
  </div>

  <div class="ui:space-y-2">
    <Label>{label('math.graph.read.points_label')}</Label>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.read.points_helper')}</p>
    {#each rawPoints as point, index (index)}
      <div class="ui:flex ui:items-center ui:gap-2" data-testid="graph-point-row">
        <NumberField
          className="ui:w-24"
          placeholder="x"
          value={typeof point.x === 'number' ? point.x : null}
          isDisabled={disabled}
          allowEmpty
          onValueChange={(next) => patchPoint(index, { x: next ?? undefined })}
        />
        <NumberField
          className="ui:w-24"
          placeholder="y"
          value={typeof point.y === 'number' ? point.y : null}
          isDisabled={disabled}
          allowEmpty
          onValueChange={(next) => patchPoint(index, { y: next ?? undefined })}
        />
        <Input
          class="ui:w-40"
          {disabled}
          maxlength={20}
          value={String(point.label ?? '')}
          placeholder={label('math.graph.read.point_label_placeholder')}
          oninput={(event) => patchPoint(index, { label: event.currentTarget.value })}
        />
        <IconButton
          type="button"
          variant="secondary"
          {disabled}
          tooltip={label('math.graph.read.remove')}
          onclick={() => patchSettings({ points: rawPoints.filter((_, pointIndex) => pointIndex !== index) })}
        >
          <XIcon class="ui:size-4" />
        </IconButton>
      </div>
    {/each}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled || rawPoints.length >= 20}
      data-testid="graph-add-point"
      onclick={() => patchSettings({ points: [...rawPoints, { x: 0, y: 0 }] })}
    >
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('math.graph.read.add_point')}
    </Button>
  </div>

  <div class="ui:space-y-2" data-testid="graph-read-preview">
    <GraphBoard board={settings.board} curves={settings.curves} markedPoints={settings.points} {labels} />
  </div>

  <div class="ui:space-y-3">
    <div class="ui:max-w-xs ui:space-y-1">
      <Label>{label('math.graph.read.answer_label')}</Label>
      <Select.Root
        type="single"
        value={answerKind}
        {disabled}
        onValueChange={(next) => changeAnswerKind(next === 'point' ? 'point' : 'value')}
      >
        <Select.Trigger class="ui:w-full" data-testid="graph-answer-kind">
          {label(`math.graph.read.kind.${answerKind}`)}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="value">{label('math.graph.read.kind.value')}</Select.Item>
          <Select.Item value="point">{label('math.graph.read.kind.point')}</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>

    <div class="ui:grid ui:gap-3 ui:md:grid-cols-3">
      {#if answerKind === 'value'}
        <div class="ui:space-y-1">
          <Label>{label('math.graph.read.value_label')}</Label>
          <NumberField
            value={answer?.kind === 'value'
              ? answer.value
              : typeof rawAnswer.value === 'number'
                ? rawAnswer.value
                : null}
            isDisabled={disabled}
            allowEmpty
            testId="graph-answer-value"
            onValueChange={(next) => patchAnswer({ value: next ?? undefined })}
          />
        </div>
      {:else}
        <div class="ui:space-y-1">
          <Label>{label('math.graph.read.x_label')}</Label>
          <NumberField
            value={typeof rawAnswer.x === 'number' ? rawAnswer.x : null}
            isDisabled={disabled}
            allowEmpty
            testId="graph-answer-x"
            onValueChange={(next) => patchAnswer({ x: next ?? undefined })}
          />
        </div>
        <div class="ui:space-y-1">
          <Label>{label('math.graph.read.y_label')}</Label>
          <NumberField
            value={typeof rawAnswer.y === 'number' ? rawAnswer.y : null}
            isDisabled={disabled}
            allowEmpty
            testId="graph-answer-y"
            onValueChange={(next) => patchAnswer({ y: next ?? undefined })}
          />
        </div>
      {/if}
      <div class="ui:space-y-1">
        <Label>{label('math.graph.edit.tolerance_label')}</Label>
        <NumberField
          value={typeof rawAnswer.tolerance === 'number' ? rawAnswer.tolerance : (answer?.tolerance ?? 0.1)}
          min={0}
          isDisabled={disabled}
          testId="graph-answer-tolerance"
          onValueChange={(next) => next !== null && patchAnswer({ tolerance: next })}
        />
      </div>
    </div>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.read.tolerance_helper')}</p>
    {#if !answer}
      <p class="ui:text-destructive ui:text-xs">{label('math.graph.read.answer_empty')}</p>
    {/if}
  </div>
</div>
