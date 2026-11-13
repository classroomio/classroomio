<script module lang="ts">
  let pendingEditorModule: Promise<typeof import('./math-text-editor')> | null = null;

  function loadEditorModule() {
    pendingEditorModule ??= import('./math-text-editor');
    return pendingEditorModule;
  }
</script>

<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import RadicalIcon from '@lucide/svelte/icons/radical';
  import { cn } from '../../tools';
  import { IconButton } from '../icon-button';
  import MathText from './math-text.svelte';
  import MathEditPopover from './math-edit-popover.svelte';
  import { DEFAULT_MATH_EDIT_LABELS, type MathEditLabels } from './types';
  import type { MathNodeClick, MathTextEditorController } from './math-text-editor';

  interface Props {
    /** `$…$` string: text with inline math. */
    value: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    labels?: MathEditLabels;
    class?: string;
  }

  let {
    value,
    onValueChange = () => {},
    placeholder = '',
    disabled = false,
    invalid = false,
    ariaLabel,
    labels = DEFAULT_MATH_EDIT_LABELS,
    class: className = ''
  }: Props = $props();

  let wrapperElement = $state<HTMLElement | null>(null);
  let editorElement = $state<HTMLElement | null>(null);
  let controller = $state.raw<MathTextEditorController | null>(null);
  let lastSyncedValue = untrack(() => value);

  let isMathPopoverOpen = $state(false);
  let mathDraft = $state('');
  let mathAnchor = $state<HTMLElement | null>(null);
  let editingMathPos: number | null = null;

  const isEmpty = $derived(value.length === 0);

  function handleEditorChange(nextValue: string) {
    lastSyncedValue = nextValue;
    onValueChange(nextValue);
  }

  function openMathPopover(latex: string, pos: number | null, anchor: HTMLElement | null) {
    mathDraft = latex;
    editingMathPos = pos;
    mathAnchor = anchor;
    isMathPopoverOpen = true;
  }

  function handleMathClick(click: MathNodeClick) {
    openMathPopover(click.latex, click.pos, click.element ?? wrapperElement);
  }

  function saveMath(latex: string) {
    controller?.saveMath(editingMathPos, latex);
  }

  function cancelMath() {
    controller?.focus();
  }

  onMount(() => {
    let isDestroyed = false;

    void loadEditorModule().then(({ createMathTextEditor }) => {
      if (isDestroyed || !editorElement) return;

      const attributes: Record<string, string> = {
        role: 'textbox',
        'aria-multiline': 'false',
        class: 'ui:outline-none ui:whitespace-pre-wrap ui:break-words'
      };
      if (ariaLabel) attributes['aria-label'] = ariaLabel;

      controller = createMathTextEditor({
        element: editorElement,
        value: lastSyncedValue,
        editable: !disabled,
        attributes,
        onChange: handleEditorChange,
        onMathClick: handleMathClick
      });
    });

    return () => {
      isDestroyed = true;
      controller?.destroy();
    };
  });

  $effect(() => {
    const nextValue = value;
    if (!controller || nextValue === lastSyncedValue) return;

    lastSyncedValue = nextValue;
    controller.setValue(nextValue);
  });

  $effect(() => {
    controller?.setEditable(!disabled);
  });
</script>

<div
  bind:this={wrapperElement}
  class={cn(
    'ui:border-input ui:bg-background ui:dark:bg-input/30 ui:shadow-xs ui:relative ui:flex ui:min-h-9 ui:w-full ui:min-w-0 ui:items-center ui:gap-1 ui:rounded-md ui:border ui:py-0.5 ui:pr-0.5 ui:pl-3 ui:text-base ui:transition-[color,box-shadow] ui:md:text-sm',
    'ui:focus-within:border-ring ui:focus-within:ring-ring/50 ui:focus-within:ring-[3px]',
    invalid && 'ui:border-destructive ui:ring-destructive/20 ui:dark:ring-destructive/40',
    disabled && 'ui:cursor-not-allowed ui:opacity-50',
    className
  )}
  data-slot="math-text-input"
>
  <div class="ui:relative ui:min-w-0 ui:flex-1 ui:py-1">
    {#if isEmpty && placeholder}
      <span class="ui:text-muted-foreground ui:pointer-events-none ui:absolute ui:inset-y-1 ui:left-0 ui:truncate">
        {placeholder}
      </span>
    {/if}
    {#if !controller}
      <span class="ui:whitespace-pre-wrap ui:break-words"><MathText text={value} /></span>
    {/if}
    <div bind:this={editorElement}></div>
  </div>

  <IconButton
    type="button"
    size="icon-sm"
    tooltip={labels.insertMath}
    disabled={disabled || !controller}
    class="ui:text-muted-foreground ui:shrink-0"
    onclick={() => openMathPopover('', null, wrapperElement)}
  >
    <RadicalIcon class="ui:size-4" />
    <span class="ui:sr-only">{labels.insertMath}</span>
  </IconButton>
</div>

<MathEditPopover
  bind:open={isMathPopoverOpen}
  bind:latex={mathDraft}
  anchor={mathAnchor}
  {labels}
  onSave={saveMath}
  onCancel={cancelMath}
/>
