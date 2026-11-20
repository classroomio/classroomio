<script lang="ts">
  import { cn } from '../../tools';

  type HighlightVariant = 'mark' | 'swipe';

  interface Props {
    /** Words inside the sentence to highlight. When omitted the whole `text` is highlighted. */
    highlight?: string;
    text?: string;
    /** `mark` fills the words with a tint; `swipe` draws the brand's low band behind them. */
    variant?: HighlightVariant;
    class?: string;
  }

  let { highlight, text, variant = 'mark', class: className }: Props = $props();

  const variantClasses: Record<HighlightVariant, string> = {
    mark: 'ui:bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] ui:rounded-sm ui:px-1 ui:py-0.5',
    swipe:
      'ui:bg-[linear-gradient(transparent_58%,color-mix(in_srgb,var(--primary)_32%,transparent)_58%,color-mix(in_srgb,var(--primary)_32%,transparent)_92%,transparent_92%)] ui:bg-transparent ui:bg-no-repeat ui:px-1'
  };

  const parts = $derived.by(() => {
    if (!highlight) return { before: text ?? '', highlighted: '', after: '' };

    const index = (text ?? '').indexOf(highlight);
    if (index === -1) return { before: text ?? '', highlighted: '', after: '' };

    return {
      before: (text ?? '').slice(0, index),
      highlighted: highlight,
      after: (text ?? '').slice(index + highlight.length)
    };
  });
</script>

<span class={className}>
  {parts.before}{#if parts.highlighted}<mark
      class={cn('ui:text-inherit ui:box-decoration-clone', variantClasses[variant])}
      data-variant={variant}>{parts.highlighted}</mark
    >{/if}{parts.after}
</span>
