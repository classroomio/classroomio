<script lang="ts">
  import katex from 'katex';
  import { Input } from '../../base/input';
  import { Label } from '../../base/label';
  import type { MathEditLabels } from './types';
  import 'katex/dist/katex.min.css';

  interface Props {
    value: string;
    labels: MathEditLabels;
    onSubmit?: () => void;
  }

  let { value = $bindable(''), labels, onSubmit }: Props = $props();

  const fieldId = $props.id();

  const preview = $derived.by(() => {
    const latex = value.trim();
    if (!latex) return { html: '', error: '' };

    try {
      return { html: katex.renderToString(latex, { throwOnError: true }), error: '' };
    } catch (error) {
      return { html: '', error: error instanceof Error ? error.message : String(error) };
    }
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    onSubmit?.();
  }
</script>

<div class="ui:space-y-3">
  <div class="ui:space-y-1.5">
    <Label for={fieldId} class="ui:text-xs ui:text-muted-foreground">{labels.latexLabel}</Label>
    <Input
      id={fieldId}
      bind:value
      class="ui:font-mono"
      placeholder={'\\frac{1}{2}'}
      autocomplete="off"
      spellcheck={false}
      onkeydown={handleKeydown}
    />
  </div>

  <div class="ui:space-y-1.5">
    <p class="ui:text-xs ui:text-muted-foreground">{labels.previewLabel}</p>
    <div
      class="ui:flex ui:min-h-12 ui:items-center ui:overflow-x-auto ui:rounded-md ui:border ui:bg-muted/30 ui:px-3 ui:py-2"
      aria-live="polite"
    >
      {#if preview.error}
        <p class="ui:text-xs ui:text-destructive">{preview.error}</p>
      {:else if preview.html}
        <span class="ui:text-lg">{@html preview.html}</span>
      {:else}
        <p class="ui:text-xs ui:text-muted-foreground">{labels.previewEmpty}</p>
      {/if}
    </div>
  </div>
</div>
