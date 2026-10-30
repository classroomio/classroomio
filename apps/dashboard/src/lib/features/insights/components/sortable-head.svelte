<script lang="ts">
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import * as Table from '@cio/ui/base/table';
  import { cn } from '@cio/ui/tools';

  import type { TableSort } from '../utils/types';
  import InfoHint from './info-hint.svelte';

  interface Props {
    label: string;
    sortKey: string;
    sort: TableSort | null;
    onSort: (key: string) => void;
    align?: 'left' | 'center';
    hint?: string;
    class?: string;
  }

  let { label, sortKey, sort, onSort, align = 'left', hint, class: className }: Props = $props();

  const isActive = $derived(sort?.key === sortKey);
  const ariaSort = $derived(isActive ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  const Icon = $derived(!isActive ? ArrowUpDownIcon : sort?.dir === 'asc' ? ArrowUpIcon : ArrowDownIcon);
</script>

<Table.Head class={cn(align === 'center' && 'text-center', className)} aria-sort={ariaSort}>
  <span class={cn('inline-flex items-center gap-1', align === 'center' && 'justify-center')}>
    <button
      type="button"
      class="ui:focus-visible:ring-ring inline-flex items-center gap-1 rounded whitespace-normal focus-visible:ring-2 focus-visible:outline-none"
      onclick={() => onSort(sortKey)}
    >
      {label}
      <Icon class={cn('size-3 shrink-0', !isActive && 'opacity-40')} aria-hidden="true" />
    </button>
    {#if hint}
      <InfoHint {hint} />
    {/if}
  </span>
</Table.Head>
