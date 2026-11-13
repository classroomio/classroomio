<script lang="ts">
  import katex from 'katex';
  import { IconButton } from '../icon-button';
  import { cn } from '../../tools';
  import { DEFAULT_MATH_STRUCTURE_LABELS } from './structures';
  import { getMathStructures } from './utils';
  import type { MathLevel, MathStructure, MathStructureLabels } from './types';
  import 'katex/dist/katex.min.css';

  interface Props {
    /** Highest level whose structures are shown; lower levels are always included. */
    level?: MathLevel;
    labels?: MathStructureLabels;
    ariaLabel?: string;
    disabled?: boolean;
    class?: string;
    onSelect: (structure: MathStructure) => void;
  }

  let {
    level = 'advanced',
    labels = DEFAULT_MATH_STRUCTURE_LABELS,
    ariaLabel,
    disabled = false,
    class: className = '',
    onSelect
  }: Props = $props();

  const items = $derived(
    getMathStructures(level).map((structure) => ({
      structure,
      previewHtml: katex.renderToString(structure.preview, { throwOnError: false })
    }))
  );
</script>

<div role="toolbar" aria-label={ariaLabel} class={cn('ui:flex ui:flex-wrap ui:gap-1', className)}>
  {#each items as { structure, previewHtml } (structure.id)}
    <IconButton
      type="button"
      size="icon-lg"
      tooltip={labels[structure.id]}
      aria-label={labels[structure.id]}
      {disabled}
      class="ui:h-10 ui:w-auto ui:min-w-10 ui:overflow-hidden ui:px-1.5 ui:text-[0.7rem]"
      onmousedown={(event: MouseEvent) => event.preventDefault()}
      onclick={() => onSelect(structure)}
    >
      {@html previewHtml}
    </IconButton>
  {/each}
</div>
