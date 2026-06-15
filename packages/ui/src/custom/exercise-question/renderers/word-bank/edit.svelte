<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { Textarea } from '../../../../base/textarea';
  import { IconButton } from '../../../icon-button';
  import { countWordBankBlanks } from './word-bank-utils';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }

  const template = $derived(String((question.settings?.template as string | undefined) ?? ''));

  const correctAnswers = $derived.by(() => {
    const raw = question.settings?.correctAnswers;
    return Array.isArray(raw) ? (raw as string[]).map((s) => String(s ?? '')) : [];
  });

  const distractors = $derived.by(() => {
    const raw = question.settings?.distractors;
    return Array.isArray(raw) ? (raw as string[]).map((s) => String(s ?? '')) : [];
  });

  const blankCount = $derived(countWordBankBlanks(template));

  function onTemplateInput(value: string) {
    const nextBlankCount = countWordBankBlanks(value);
    const prev = correctAnswers;
    const nextCorrect: string[] = [];
    for (let i = 0; i < nextBlankCount; i++) {
      nextCorrect.push(prev[i] ?? '');
    }
    patchSettings({ template: value, correctAnswers: nextCorrect });
  }

  function setCorrectAnswerAt(index: number, value: string) {
    const next = [...correctAnswers];
    next[index] = value;
    patchSettings({ correctAnswers: next });
  }

  function addDistractor() {
    patchSettings({ distractors: [...distractors, ''] });
  }

  function setDistractorAt(index: number, value: string) {
    const next = [...distractors];
    next[index] = value;
    patchSettings({ distractors: next });
  }

  function removeDistractorAt(index: number) {
    patchSettings({ distractors: distractors.filter((_, i) => i !== index) });
  }
</script>

<div class="ui:space-y-4">
  <div class="ui:space-y-2">
    <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.edit.template_label')}</p>
    <Textarea
      class="ui:w-full"
      rows={4}
      value={template}
      placeholder={label('word_bank.edit.template_placeholder')}
      {disabled}
      onchange={(event) => onTemplateInput(event.currentTarget.value)}
    />
    <p class="ui:text-muted-foreground ui:text-xs">
      {label('word_bank.edit.template_helper')}
    </p>
    {#if blankCount === 0 && template.trim().length > 0}
      <p class="ui:text-destructive ui:text-xs">{label('word_bank.edit.no_blanks_warning')}</p>
    {/if}
  </div>

  {#if blankCount > 0}
    <div class="ui:space-y-2">
      <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.edit.correct_answers_heading')}</p>
      <div class="ui:flex ui:flex-col ui:gap-2">
        {#each Array.from({ length: blankCount }, (_, i) => i) as blankIndex (blankIndex)}
          <div class="ui:flex ui:flex-col ui:gap-1 ui:sm:flex-row ui:sm:items-center ui:sm:gap-3">
            <span class="ui:text-muted-foreground ui:min-w-18 ui:text-sm"
              >{label('word_bank.edit.blank_label')} {blankIndex + 1}</span
            >
            <Input
              class="ui:flex-1"
              value={correctAnswers[blankIndex] ?? ''}
              placeholder={label('word_bank.edit.correct_placeholder')}
              {disabled}
              onchange={(event) => setCorrectAnswerAt(blankIndex, event.currentTarget.value)}
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="ui:space-y-2">
    <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.edit.distractors_heading')}</p>
    <div class="ui:flex ui:flex-col ui:gap-2">
      {#each distractors as _, distractorIndex (distractorIndex)}
        <div class="ui:flex ui:items-center ui:gap-2">
          <Input
            class="ui:flex-1"
            value={distractors[distractorIndex] ?? ''}
            placeholder={label('word_bank.edit.distractor_placeholder')}
            {disabled}
            onchange={(event) => setDistractorAt(distractorIndex, event.currentTarget.value)}
          />
          <IconButton
            type="button"
            class="ui:shrink-0 ui:text-muted-foreground"
            {disabled}
            tooltip={label('common.remove')}
            onclick={() => removeDistractorAt(distractorIndex)}
          >
            <Trash2Icon class="ui:size-4" />
          </IconButton>
        </div>
      {/each}
    </div>
    <Button type="button" variant="outline" size="sm" {disabled} onclick={addDistractor}>
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('word_bank.edit.add_distractor')}
    </Button>
  </div>
</div>
