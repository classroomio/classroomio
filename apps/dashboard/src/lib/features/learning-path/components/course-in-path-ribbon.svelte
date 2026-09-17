<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { LearningPathBadge } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseInPathNode } from './types';

  interface Props {
    pathName: string;
    pathHref: string;
    nodes: CourseInPathNode[];
    onClick?: () => void;
  }

  let { pathName, pathHref, nodes, onClick }: Props = $props();

  const inProgressIndex = $derived(nodes.findIndex((node) => node.state === 'IN_PROGRESS'));

  const positionLabel = $derived(
    $t('learningPath.ribbon.course_n_of_total', {
      position: String(inProgressIndex >= 0 ? inProgressIndex + 1 : nodes.length),
      total: String(nodes.length)
    })
  );

  function dotClass(node: CourseInPathNode) {
    if (node.state === 'COMPLETED') return 'ui:bg-emerald-500 ui:border-emerald-500 ui:text-white';
    if (node.state === 'IN_PROGRESS') return 'ui:bg-primary ui:border-primary ui:text-primary-foreground';
    return 'ui:bg-muted ui:text-muted-foreground ui:border-border';
  }
</script>

<div class="ui:bg-secondary/50 ui:border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-y px-4 py-2.5">
  <a href={pathHref} onclick={onClick} class="group flex min-w-0 items-center gap-2">
    <LearningPathBadge label={$t('learningPath.badge.learning_path')} />
    <span class="ui:text-muted-foreground ui:group-hover:text-foreground min-w-0 truncate text-xs font-medium">
      {$t('learningPath.ribbon.path_label')}:
      <strong class="ui:text-foreground font-semibold">{pathName}</strong>
    </span>
  </a>

  <div class="hidden items-center gap-1.5 md:flex">
    {#each nodes as node, index (node.title)}
      {#if index > 0}
        <span
          class="h-0.5 w-3.5 shrink-0 rounded-full {nodes[index - 1].state === 'COMPLETED'
            ? 'ui:bg-emerald-500'
            : 'ui:bg-border'}"
        />
      {/if}
      <span
        class="flex size-[22px] shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold {dotClass(
          node
        )}"
        title={node.title}
      >
        {#if node.state === 'COMPLETED'}
          <CheckIcon class="size-2.5" strokeWidth={3} />
        {:else if node.state === 'LOCKED'}
          <LockIcon class="size-2.5" />
        {:else}
          {index + 1}
        {/if}
      </span>
    {/each}
    <span class="tnum ui:text-muted-foreground ml-1 truncate text-xs font-medium whitespace-nowrap">
      {positionLabel}
    </span>
  </div>

  <a
    href={pathHref}
    onclick={onClick}
    class="ui:text-muted-foreground ui:hover:text-primary ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
  >
    {$t('learningPath.ribbon.view_path')}
    <ArrowRightIcon class="size-3.5" />
  </a>
</div>
