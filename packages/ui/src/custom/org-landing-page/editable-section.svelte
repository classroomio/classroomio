<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getLandingPageEditContext, type LandingSectionKey } from './edit-context';
  import { cn } from '../../tools';

  interface Props {
    sectionKey: LandingSectionKey;
    /** Extra classes applied to the wrapper (only used when edit context is active). */
    class?: string;
    children: Snippet;
  }

  let { sectionKey, class: className, children }: Props = $props();

  const ctx = getLandingPageEditContext();
  const selected = $derived(ctx?.selectedKey() === sectionKey);
  const Icon = $derived(ctx?.iconFor(sectionKey));

  function handleClick(event: MouseEvent) {
    if (!ctx) return;
    event.stopPropagation();
    ctx.selectKey(sectionKey);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!ctx) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    ctx.selectKey(sectionKey);
  }
</script>

{#if !ctx}
  {@render children()}
{:else}
  <div
    data-landing-section={sectionKey}
    role="button"
    tabindex="0"
    aria-pressed={selected}
    onclick={handleClick}
    onkeydown={handleKeydown}
    class={cn(
      'ui:relative ui:outline-none ui:cursor-pointer ui:transition-shadow',
      selected
        ? 'ui:ring-2 ui:ring-primary ui:ring-inset'
        : 'ui:hover:ring-2 ui:hover:ring-primary/40 ui:hover:ring-inset',
      className
    )}
  >
    {#if selected}
      <div
        class="ui:absolute ui:top-0 ui:left-0 ui:z-30 ui:-translate-y-full ui:flex ui:items-center ui:gap-1.5 ui:rounded-t-md ui:bg-primary ui:px-2 ui:py-1 ui:text-xs ui:font-medium ui:text-primary-foreground ui:shadow-sm ui:pointer-events-none"
      >
        {#if Icon}
          <Icon size={14} class="ui:size-3.5" />
        {/if}
        <span>{ctx.labelFor(sectionKey)}</span>
      </div>
    {/if}
    {@render children()}
  </div>
{/if}
