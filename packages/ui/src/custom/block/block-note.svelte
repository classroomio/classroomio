<script lang="ts">
  import type { Snippet } from 'svelte';
  import { SafeHtmlContent } from '../safe-html-content';

  interface Props {
    editable?: boolean;
    contentHtml?: string;
    empty?: boolean;
    emptyLabel?: string;
    editor?: Snippet;
    view?: Snippet;
  }

  let {
    editable = false,
    contentHtml = '',
    empty = false,
    emptyLabel = 'This note is empty',
    editor,
    view
  }: Props = $props();
</script>

{#if editable}
  <div class="ui:min-h-[250px]">
    {#if editor}
      {@render editor()}
    {/if}
  </div>
{:else}
  <div class="ui:mx-auto ui:w-full ui:max-w-2xl">
    {#if empty}
      <p class="ui:text-muted-foreground ui:text-sm italic">{emptyLabel}</p>
    {:else if view}
      {@render view()}
    {:else}
      <div class="prose ui:max-w-none">
        <SafeHtmlContent content={contentHtml} />
      </div>
    {/if}
  </div>
{/if}
