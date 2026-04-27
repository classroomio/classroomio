<script lang="ts">
  import { MentionPopover, type MentionItem } from '@cio/ui/custom/mention-popover';
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';

  interface ContentMentionItem {
    id: string;
    title: string;
    type: string;
  }

  interface Props {
    items: ContentMentionItem[];
    query: string;
    selectedIndex: number;
    onSelect: (item: ContentMentionItem) => void;
  }

  let { items, query, selectedIndex, onSelect }: Props = $props();

  const mentionItems: MentionItem[] = $derived(
    items.map((item) => ({ id: item.id, label: item.title, type: item.type }))
  );

  function handleSelect(mentionItem: MentionItem) {
    const original = items.find((item) => item.id === mentionItem.id);

    if (original) {
      onSelect(original);
    }
  }

  function getTypeLabel(item: MentionItem) {
    return item.type === 'EXERCISE' ? t.get('ai_assistant.mention_exercise') : t.get('ai_assistant.mention_lesson');
  }
</script>

<MentionPopover
  items={mentionItems}
  {query}
  {selectedIndex}
  onSelect={handleSelect}
  typeLabel={getTypeLabel}
  emptyMessage={t.get('ai_assistant.mention_no_results')}
>
  {#snippet icon({ item })}
    {#if item.type === 'EXERCISE'}
      <ExerciseIcon size={14} />
    {:else}
      <LessonIcon size={14} />
    {/if}
  {/snippet}
</MentionPopover>
