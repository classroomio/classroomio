<script lang="ts">
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import { displayNoteTitle } from '../utils/note-list-utils';

  export type NoteSubpage = {
    id: string;
    title: string;
    sortOrder?: number;
    updatedAt?: string;
  };

  interface Props {
    noteId: string;
    children?: NoteSubpage[];
    canWrite?: boolean;
    noteHref: (childId: string) => string;
    onCreateChild?: () => void | Promise<void>;
    class?: string;
  }

  let {
    noteId,
    children = [],
    canWrite = false,
    noteHref,
    onCreateChild,
    class: className = ''
  }: Props = $props();

  const sortedChildren = $derived(
    [...children].sort(
      (left, right) =>
        (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
        new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime()
    )
  );
</script>

<section class={cn('border-border mt-6 border-t pt-4', className)}>
  <div class="mb-3 flex items-center justify-between gap-3">
    <h2 class="text-sm font-semibold tracking-wide uppercase">{$t('notes.subpages.heading')}</h2>
    {#if canWrite}
      <Button variant="secondary" size="sm" onclick={() => onCreateChild?.()}>
        <PlusIcon size={14} />
        {$t('notes.subpages.new')}
      </Button>
    {/if}
  </div>

  {#if sortedChildren.length === 0}
    <p class="ui:text-muted-foreground text-sm">{$t('notes.subpages.empty')}</p>
  {:else}
    <ul class="grid gap-2 sm:grid-cols-2">
      {#each sortedChildren as child (child.id)}
        <li>
          <a
            href={noteHref(child.id)}
            class="border-border ui:hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
          >
            <FileTextIcon size={16} class="ui:text-muted-foreground mt-0.5 shrink-0" />
            <div class="min-w-0">
              <p class="truncate font-medium">{displayNoteTitle(child.title)}</p>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>
