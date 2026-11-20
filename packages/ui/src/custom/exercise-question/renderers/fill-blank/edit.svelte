<script lang="ts">
  import {
    decodeFillBlankAcceptedAnswers,
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }

  const blanks = $derived.by(() => {
    const decoded = decodeFillBlankAcceptedAnswers(question.settings?.acceptedAnswers);
    return decoded.length > 0 ? decoded : [['']];
  });

  function setBlanks(next: string[][]) {
    patchSettings({ acceptedAnswers: next });
  }

  function updateBlank(blankIndex: number, alternatives: string[]) {
    setBlanks(blanks.map((current, index) => (index === blankIndex ? alternatives : current)));
  }

  function setAlternativeAt(blankIndex: number, alternativeIndex: number, value: string) {
    const alternatives = blanks[blankIndex].map((current, index) => (index === alternativeIndex ? value : current));
    updateBlank(blankIndex, alternatives);
  }

  function addAlternative(blankIndex: number) {
    updateBlank(blankIndex, [...blanks[blankIndex], '']);
  }

  function removeAlternativeAt(blankIndex: number, alternativeIndex: number) {
    updateBlank(
      blankIndex,
      blanks[blankIndex].filter((_, index) => index !== alternativeIndex)
    );
  }

  function addBlank() {
    setBlanks([...blanks, ['']]);
  }

  function removeBlankAt(blankIndex: number) {
    setBlanks(blanks.filter((_, index) => index !== blankIndex));
  }
</script>

<div class="ui:space-y-3">
  <p class="ui:text-muted-foreground ui:text-xs">{label('fill_blank.edit.helper')}</p>

  {#each blanks as alternatives, blankIndex (blankIndex)}
    <div class="ui:space-y-2 ui:rounded-md ui:border ui:p-3">
      <div class="ui:flex ui:items-center ui:justify-between ui:gap-2">
        <span class="ui:text-sm ui:font-medium">{label('fill_blank.edit.blank_label')} {blankIndex + 1}</span>
        {#if blanks.length > 1}
          <IconButton
            type="button"
            class="ui:shrink-0 ui:text-muted-foreground"
            {disabled}
            tooltip={label('common.remove')}
            onclick={() => removeBlankAt(blankIndex)}
          >
            <Trash2Icon class="ui:size-4" />
          </IconButton>
        {/if}
      </div>

      {#each alternatives as alternative, alternativeIndex (alternativeIndex)}
        <div class="ui:flex ui:items-center ui:gap-2">
          <Input
            class="ui:flex-1"
            value={alternative}
            placeholder={label('fill_blank.edit.accepted_answers_placeholder')}
            {disabled}
            oninput={(event) => setAlternativeAt(blankIndex, alternativeIndex, event.currentTarget.value)}
          />
          {#if alternatives.length > 1}
            <IconButton
              type="button"
              class="ui:shrink-0 ui:text-muted-foreground"
              {disabled}
              tooltip={label('common.remove')}
              onclick={() => removeAlternativeAt(blankIndex, alternativeIndex)}
            >
              <XIcon class="ui:size-4" />
            </IconButton>
          {/if}
        </div>
      {/each}

      <Button type="button" variant="ghost" size="sm" {disabled} onclick={() => addAlternative(blankIndex)}>
        <PlusIcon class="ui:mr-1 ui:size-4" />
        {label('fill_blank.edit.add_alternative')}
      </Button>
    </div>
  {/each}

  <Button type="button" variant="outline" size="sm" {disabled} onclick={addBlank}>
    <PlusIcon class="ui:mr-1 ui:size-4" />
    {label('fill_blank.edit.add_blank')}
  </Button>
</div>
