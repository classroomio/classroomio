<script lang="ts">
  import { Button } from '$src/base/button';
  import type { Editor } from '@tiptap/core';
  import Search from '@lucide/svelte/icons/search';
  import * as Popover from '$src/base/popover';
  import { Input } from '$src/base/input';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
  import Replace from '@lucide/svelte/icons/replace';
  import ReplaceAll from '@lucide/svelte/icons/replace-all';
  import { cn } from '$src/tools';
  import { slide } from 'svelte/transition';
  import EdraToolTip from '../EdraToolTip.svelte';

  interface Props {
    editor: Editor;
  }

  const { editor }: Props = $props();

  let open = $state(false);
  let showMore = $state(false);

  let searchText = $state('');
  let replaceText = $state('');
  let caseSensitive = $state(false);

  let searchIndex = $derived(editor.storage?.searchAndReplace?.resultIndex);
  let searchCount = $derived(editor.storage?.searchAndReplace?.results.length);

  function updateSearchTerm(clearIndex: boolean = false) {
    if (clearIndex) editor.commands.resetIndex();

    editor.commands.setSearchTerm(searchText);
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.setCaseSensitive(caseSensitive);
  }

  function goToSelection() {
    const { results, resultIndex } = editor.storage.searchAndReplace;
    const position = results[resultIndex];
    if (!position) return;
    editor.commands.setTextSelection(position);
    const { node } = editor.view.domAtPos(editor.state.selection.anchor);
    if (node instanceof HTMLElement) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function replace() {
    editor.commands.replace();
    goToSelection();
  }

  const next = () => {
    editor.commands.nextSearchResult();
    goToSelection();
  };

  const previous = () => {
    editor.commands.previousSearchResult();
    goToSelection();
  };

  const clear = () => {
    searchText = '';
    replaceText = '';
    caseSensitive = false;
    editor.commands.resetIndex();
  };

  const replaceAll = () => editor.commands.replaceAll();
</script>

<Popover.Root
  bind:open
  onOpenChange={(value) => {
    if (value === false) {
      clear();
      updateSearchTerm();
    }
  }}
>
  <Popover.Trigger>
    <EdraToolTip tooltip="Search and Replace">
      <Button variant="ghost" size="icon" class="ui:gap-0.5">
        <Search />
        <ChevronDown class="ui:text-muted-foreground !size-2" />
      </Button>
    </EdraToolTip>
  </Popover.Trigger>
  <Popover.Content
    class="ui:flex ui:w-fit ui:items-center ui:gap-1 ui:p-2"
    portalProps={{ disabled: true, to: undefined }}
  >
    <Button
      variant="ghost"
      size="icon"
      class={cn('ui:transition-transform', showMore && 'bg-muted rotate-90')}
      onclick={() => (showMore = !showMore)}
      title="Show More"
    >
      <ChevronRight />
    </Button>
    <div class="ui:flex ui:size-full ui:flex-col ui:gap-1">
      <div class="ui:flex ui:w-full ui:items-center ui:gap-1">
        <Input placeholder="Search..." bind:value={searchText} oninput={() => updateSearchTerm()} class="ui:w-40" />
        <span class="ui:text-muted-foreground ui:text-sm">{searchCount > 0 ? searchIndex + 1 : 0}/{searchCount} </span>
        <EdraToolTip tooltip="Case Sensitive">
          <Button
            variant="ghost"
            size="icon"
            class={cn(caseSensitive && 'bg-muted')}
            onclick={() => {
              caseSensitive = !caseSensitive;
              updateSearchTerm();
            }}
          >
            <CaseSensitive />
          </Button>
        </EdraToolTip>
        <EdraToolTip tooltip="Go to previous">
          <Button variant="ghost" size="icon" onclick={previous} title="Previous">
            <ArrowLeft />
          </Button>
        </EdraToolTip>
        <EdraToolTip tooltip="Go to next">
          <Button variant="ghost" size="icon" onclick={next} title="Next">
            <ArrowRight />
          </Button>
        </EdraToolTip>
      </div>
      {#if showMore}
        <div transition:slide class="ui:flex ui:w-full ui:items-center ui:gap-1">
          <Input placeholder="Replace..." bind:value={replaceText} oninput={() => updateSearchTerm()} class="ui:w-40" />
          <EdraToolTip tooltip="Replace">
            <Button variant="ghost" size="icon" onclick={replace}>
              <Replace />
            </Button>
          </EdraToolTip>
          <EdraToolTip tooltip="Replace All">
            <Button variant="ghost" size="icon" onclick={replaceAll}>
              <ReplaceAll />
            </Button>
          </EdraToolTip>
        </div>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
