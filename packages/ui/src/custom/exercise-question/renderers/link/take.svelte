<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';
  import { FieldDraft } from '../../../../hooks/field-draft.svelte';
  import type { LinkRow } from './types';

  let { answer, disabled = false, labels, onAnswerChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function isValidLink(value: string): boolean {
    try {
      const parsedUrl = new URL(value);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function toAnswerLinks(value: ExerciseQuestionRendererProps['answer']): string[] {
    if (value?.type === 'LINK') return value.urls.map((u) => String(u ?? '').trim()).filter(Boolean);
    return [];
  }

  const links = new FieldDraft<string[], LinkRow[]>({
    value: () => toAnswerLinks(answer),
    format: (urls) => (urls.length > 0 ? urls : ['']).map((url) => ({ id: crypto.randomUUID(), text: url })),
    parse: (rows) => rows.map((row) => row.text.trim()).filter(Boolean),
    onChange: (urls) => onAnswerChange({ type: 'LINK', urls })
  });

  function updateLink(rowId: string, text: string) {
    links.input(links.draft.map((row) => (row.id === rowId ? { ...row, text } : row)));
  }

  function addLinkField() {
    links.input([...links.draft, { id: crypto.randomUUID(), text: '' }]);
  }

  function removeLinkField(rowId: string) {
    if (links.draft.length === 1) return;

    links.input(links.draft.filter((row) => row.id !== rowId));
  }

  function formatInputPlaceholder(index: number): string {
    const template = label('link.take.placeholder');
    if (!template) return '';
    return template.replace('{index}', String(index + 1));
  }

  let focusedRowId: string | null = $state(null);

  const validationState = $derived.by(() =>
    links.draft.map((row) => {
      const trimmedValue = row.text.trim();
      const isEmpty = trimmedValue.length === 0;

      return {
        isEmpty,
        isValid: isEmpty ? true : isValidLink(trimmedValue)
      };
    })
  );
</script>

<div class="ui:space-y-3">
  <p class="ui:text-muted-foreground ui:text-xs">{label('link.take.helper')}</p>

  <div class="ui:space-y-2">
    {#each links.draft as row, index (row.id)}
      <div class="ui:space-y-1">
        <div class="ui:flex ui:items-center ui:gap-2">
          <Input
            class="ui:flex-1 ui:max-w-[300px]"
            type="url"
            value={row.text}
            {disabled}
            placeholder={formatInputPlaceholder(index)}
            oninput={(event) => updateLink(row.id, event.currentTarget.value)}
            onfocus={() => (focusedRowId = row.id)}
            onblur={() => {
              if (focusedRowId === row.id) focusedRowId = null;
            }}
          />
          <IconButton
            type="button"
            tooltip={label('link.take.remove_tooltip')}
            disabled={disabled || links.draft.length === 1}
            onclick={() => removeLinkField(row.id)}
          >
            <Trash2Icon class="ui:size-4" />
            <span class="ui:sr-only">{label('link.take.remove_sr')}</span>
          </IconButton>
        </div>

        {#if focusedRowId !== row.id && !validationState[index]?.isEmpty && !validationState[index]?.isValid}
          <p class="ui:text-destructive ui:text-xs">{label('link.take.invalid_url_error')}</p>
        {/if}
      </div>
    {/each}
  </div>

  <Button variant="outline" size="sm" type="button" {disabled} onclick={addLinkField}>
    <PlusIcon class="ui:size-4" />
    {label('link.take.add_button')}
  </Button>
</div>
