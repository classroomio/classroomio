<script lang="ts">
  import type { Snippet } from 'svelte';
  import InfoIcon from '@lucide/svelte/icons/info';
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
  import BadgeAlertIcon from '@lucide/svelte/icons/badge-alert';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import HighlighterIcon from '@lucide/svelte/icons/highlighter';
  import { SafeHtmlContent } from '../../safe-html-content';
  import type { NoteBlockStyle } from './types';

  const styleMeta = {
    info: {
      icon: InfoIcon,
      className: 'ui:border-blue-200 ui:bg-blue-50/70 ui:dark:border-blue-900 ui:dark:bg-blue-950/30'
    },
    tip: {
      icon: LightbulbIcon,
      className: 'ui:border-emerald-200 ui:bg-emerald-50/70 ui:dark:border-emerald-900 ui:dark:bg-emerald-950/30'
    },
    important: {
      icon: BadgeAlertIcon,
      className: 'ui:border-violet-200 ui:bg-violet-50/70 ui:dark:border-violet-900 ui:dark:bg-violet-950/30'
    },
    warning: {
      icon: TriangleAlertIcon,
      className: 'ui:border-amber-200 ui:bg-amber-50/70 ui:dark:border-amber-900 ui:dark:bg-amber-950/30'
    },
    highlight: {
      icon: HighlighterIcon,
      className: 'ui:border-yellow-200 ui:bg-yellow-50/70 ui:dark:border-yellow-900 ui:dark:bg-yellow-950/30'
    }
  } as const;

  interface Props {
    style?: NoteBlockStyle;
    editable?: boolean;
    contentHtml?: string;
    empty?: boolean;
    styleLabel?: string;
    emptyLabel?: string;
    editor?: Snippet;
    view?: Snippet;
  }

  let {
    style = 'default',
    editable = false,
    contentHtml = '',
    empty = false,
    styleLabel = '',
    emptyLabel = 'This note is empty',
    editor,
    view
  }: Props = $props();

  const meta = $derived(style === 'default' ? undefined : styleMeta[style]);
</script>

{#snippet body()}
  {#if editable}
    {#if editor}
      {@render editor()}
    {/if}
  {:else if !empty}
    {#if view}
      {@render view()}
    {:else}
      <div class="prose ui:max-w-none">
        <SafeHtmlContent content={contentHtml} />
      </div>
    {/if}
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm italic">{emptyLabel}</p>
  {/if}
{/snippet}

{#if !meta}
  {#if editable}
    <div class="ui:min-h-[250px]">
      {@render body()}
    </div>
  {:else}
    <div class="ui:mx-auto ui:w-full ui:max-w-2xl">
      {@render body()}
    </div>
  {/if}
{:else}
  {@const StyleIcon = meta.icon}
  <div class="ui:rounded-xl ui:p-4 {meta.className}">
    <div class="ui:mb-2 ui:flex ui:items-center ui:gap-2">
      <StyleIcon size={16} />
      <span class="ui:text-xs ui:font-semibold ui:tracking-wide uppercase">{styleLabel}</span>
    </div>
    {@render body()}
  </div>
{/if}
