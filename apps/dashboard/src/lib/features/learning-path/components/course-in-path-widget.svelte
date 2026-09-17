<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseInPathNode } from './types';

  interface Props {
    pathName: string;
    pathHref: string;
    nodes: CourseInPathNode[];
    currentPosition?: number;
    onClick?: () => void;
  }

  let { pathName, pathHref, nodes, currentPosition, onClick }: Props = $props();

  const currentIndex = $derived(
    currentPosition != null ? currentPosition - 1 : nodes.findIndex((node) => node.state === 'IN_PROGRESS')
  );
  const safeCurrentIndex = $derived(currentIndex >= 0 ? currentIndex : nodes.length - 1);

  const positionLabel = $derived(
    $t('learningPath.ribbon.course_n_of_total', {
      position: String(safeCurrentIndex + 1),
      total: String(nodes.length)
    })
  );

  function dotClass(node: CourseInPathNode, index: number) {
    if (index === safeCurrentIndex) return 'ui:bg-primary ui:border-primary ui:text-primary-foreground';
    if (node.state === 'COMPLETED') return 'ui:bg-emerald-500 ui:border-emerald-500 ui:text-white';
    return 'ui:bg-muted ui:text-muted-foreground ui:border-border';
  }
</script>

<a
  href={pathHref}
  onclick={onClick}
  title={`${pathName} — ${$t('learningPath.ribbon.view_path')}`}
  class="ui:bg-primary/10 ui:border-primary/25 ui:hover:border-primary/50 hidden min-w-0 items-center gap-2.5 rounded-full border px-3 py-1 transition-colors md:inline-flex"
>
  <span
    class="ui:text-primary inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase"
  >
    <PathIcon size={13} strokeWidth={2.2} />
    {$t('learningPath.ribbon.path_label')}
  </span>

  <div class="flex min-w-0 items-center">
    {#each nodes as node, index (index)}
      {#if index > 0}
        <span
          class="h-0.5 w-[22px] shrink-0 rounded-full {nodes[index - 1].state === 'COMPLETED'
            ? 'ui:bg-emerald-500'
            : 'ui:bg-border'}"
        ></span>
      {/if}

      <span
        class="flex size-[22px] shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold {dotClass(
          node,
          index
        )}"
        title={node.title}
      >
        {#if index === safeCurrentIndex}
          {index + 1}
        {:else if node.state === 'COMPLETED'}
          <CheckIcon class="size-2.5" strokeWidth={3} />
        {:else if node.state === 'LOCKED'}
          <LockIcon class="size-2.5" />
        {:else}
          {index + 1}
        {/if}
      </span>
    {/each}

    <span class="tnum ui:text-foreground ml-2 truncate text-xs font-medium whitespace-nowrap">
      {positionLabel}
    </span>
  </div>
</a>
