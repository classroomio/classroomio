<script lang="ts">
  import { cn } from '../../tools';
  import { codeVariants } from './';
  import type { CodeRootProps } from './types';
  import { useCode } from './code-utils.svelte';
  import { box } from 'svelte-toolbelt';

  let {
    ref = $bindable(null),
    variant = 'default',
    lang = 'typescript',
    code,
    class: className,
    hideLines = false,
    highlight = [],
    children,
    ...rest
  }: CodeRootProps = $props();

  const codeState = useCode({
    code: box.with(() => code),
    hideLines: box.with(() => hideLines),
    highlight: box.with(() => highlight),
    lang: box.with(() => lang)
  });
</script>

<div {...rest} bind:this={ref} class={cn(codeVariants({ variant }), className)}>
  {@html codeState.highlighted}
  {@render children?.()}
</div>

<style>
  @reference "../../index.css";

  :global(.dark) {
    :global(.shiki, .shiki span) {
      color: var(--shiki-dark) !important;
      font-style: var(--shiki-dark-font-style) !important;
      font-weight: var(--shiki-dark-font-weight) !important;
      text-decoration: var(--shiki-dark-text-decoration) !important;
    }
  }

  /* Shiki see: https://shiki.matsu.io/guide/dual-themes#class-based-dark-mode */
  :global(html.dark .shiki, html.dark .shiki span) {
    color: var(--shiki-dark) !important;
    font-style: var(--shiki-dark-font-style) !important;
    font-weight: var(--shiki-dark-font-weight) !important;
    text-decoration: var(--shiki-dark-text-decoration) !important;
  }

  :global(pre.shiki) {
    @apply ui:overflow-x-auto ui:rounded-lg ui:bg-inherit ui:py-4 ui:text-sm;
    white-space: pre-wrap;
  }

  :global(pre.shiki:not([data-code-overflow] *):not([data-code-overflow])) {
    @apply ui:overflow-y-auto;
    max-height: min(100%, 650px);
  }

  :global(pre.shiki code) {
    @apply ui:grid ui:min-w-full ui:rounded-none ui:border-0 ui:bg-transparent ui:p-0 ui:break-words;
    counter-reset: line;
    box-decoration-break: clone;
  }

  :global(pre.line-numbers) {
    counter-reset: step;
    counter-increment: step 0;
  }

  :global(pre.line-numbers .line::before) {
    content: counter(step);
    counter-increment: step;
    display: inline-block;
    width: 1.8rem;
    margin-right: 1.4rem;
    text-align: right;
  }

  :global(pre.line-numbers .line::before) {
    @apply ui:text-muted-foreground;
  }

  :global(pre .line.line--highlighted) {
    @apply ui:bg-secondary;
  }

  :global(pre .line.line--highlighted span) {
    @apply ui:relative;
  }

  :global(pre .line) {
    @apply ui:inline-block ui:min-h-4 ui:w-full ui:px-4 ui:py-0.5;
  }

  :global(pre.line-numbers .line) {
    @apply ui:px-2;
  }
</style>
