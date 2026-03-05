<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';

  let { answer, disabled = false, labels, onAnswerChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  let links = $derived.by<string[]>(() => {
    const nextLinks = toAnswerLinks(answer);
    return nextLinks.length > 0 ? nextLinks : [''];
  });

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

  function syncAnswer(nextLinks: string[]) {
    const normalizedLinks = nextLinks.map((entry) => entry.trim()).filter(Boolean);
    onAnswerChange({ type: 'LINK', urls: normalizedLinks });
  }

  function addLinkField() {
    links = [...links, ''];
  }

  function removeLinkField(index: number) {
    if (links.length === 1) return;
    const nextLinks = links.filter((_, linkIndex) => linkIndex !== index);
    links = nextLinks;
    syncAnswer(nextLinks);
  }

  function updateLink(index: number, value: string) {
    const nextLinks = links.map((linkValue, linkIndex) => (linkIndex === index ? value : linkValue));
    links = nextLinks;
    syncAnswer(nextLinks);
  }

  function formatInputPlaceholder(index: number): string {
    const template = label('link.take.placeholder');
    if (!template) return '';
    return template.replace('{index}', String(index + 1));
  }

  const validationState = $derived.by(() =>
    links.map((linkValue) => {
      const trimmedValue = linkValue.trim();
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
    {#each links as link, index}
      <div class="ui:space-y-1">
        <div class="ui:flex ui:items-center ui:gap-2">
          <Input
            class="ui:flex-1 ui:max-w-[300px]"
            type="url"
            value={link}
            {disabled}
            placeholder={formatInputPlaceholder(index)}
            onchange={(event) => updateLink(index, event.currentTarget.value)}
          />
          <IconButton
            type="button"
            tooltip={label('link.take.remove_tooltip')}
            disabled={disabled || links.length === 1}
            onclick={() => removeLinkField(index)}
          >
            <Trash2Icon class="ui:size-4" />
            <span class="ui:sr-only">{label('link.take.remove_sr')}</span>
          </IconButton>
        </div>

        {#if !validationState[index]?.isEmpty && !validationState[index]?.isValid}
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
