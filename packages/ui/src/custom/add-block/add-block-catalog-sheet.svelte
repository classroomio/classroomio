<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Sheet from '../../base/sheet';
  import Catalog from './add-block-catalog.svelte';
  import type { AddBlockChoice } from './types';

  interface Props {
    choices: AddBlockChoice[];
    label: string;
    searchLabel?: string;
    noResultsLabel?: string;
    newLabel?: string;
    comingSoonLabel?: string;
    testId?: string;
    onSelect: (type: string) => void;
    trigger: Snippet<[{ open: boolean; toggle: () => void }]>;
  }

  let { choices, label, searchLabel, noResultsLabel, newLabel, comingSoonLabel, testId, onSelect, trigger }: Props =
    $props();

  let open = $state(false);

  function toggle() {
    open = !open;
  }

  function select(type: string) {
    open = false;
    onSelect(type);
  }
</script>

{@render trigger({ open, toggle })}

<Sheet.Root bind:open>
  <Sheet.Content
    side="right"
    class="ui:w-full ui:gap-0 ui:p-0 ui:sm:max-w-[480px]"
    data-testid={testId ? `${testId}-menu` : undefined}
  >
    <Sheet.Header class="ui:border-border ui:border-b ui:px-4 ui:py-3.5">
      <Sheet.Title>{label}</Sheet.Title>
    </Sheet.Header>
    <div class="ui:flex-1 ui:overflow-y-auto ui:p-4">
      {#if open}
        <Catalog
          {choices}
          {label}
          {searchLabel}
          {noResultsLabel}
          {newLabel}
          {comingSoonLabel}
          autofocus
          testId={testId ? `${testId}-grid` : undefined}
          onSelect={select}
        />
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
