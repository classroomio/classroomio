<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { ExternalLinkIcon, HoverableItem } from '../../../moving-icons';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();
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

  const links = $derived.by(() => {
    if (answer?.type === 'LINK') return answer.urls.map((u) => String(u ?? '').trim()).filter(Boolean);
    return [];
  });

  function formatLinkLabel(index: number): string {
    const template = label('link.preview.item_label');
    if (!template) return String(index + 1);
    return template.replace('{index}', String(index + 1));
  }
</script>

<div class="ui:space-y-2">
  {#if links.length === 0}
    <p class="ui:text-muted-foreground ui:text-sm">{label('link.preview.empty')}</p>
  {:else}
    <div class="ui:space-y-2">
      {#each links as link, index}
        <div class="ui:bg-background ui:rounded-md ui:border ui:p-2">
          {#if isValidLink(link)}
            <HoverableItem>
              {#snippet children(isHovered)}
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  class="ui:text-primary ui:inline-flex ui:items-center ui:gap-2 ui:text-sm ui:underline"
                >
                  <span>{formatLinkLabel(index)}</span>
                  <ExternalLinkIcon {isHovered} size={14} class="ui:shrink-0" ariaHidden={true} />
                </a>
              {/snippet}
            </HoverableItem>
            <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">{link}</p>
          {:else}
            <p class="ui:text-sm">{link}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
