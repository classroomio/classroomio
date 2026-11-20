<script lang="ts">
  import type { Snippet } from 'svelte';
  import { DEFAULT_MATH_IMAGE_LABELS, setMathImageConverter, type MathImageConversion } from '@cio/ui/custom/math-text';

  interface Props {
    /** What the mock converter returns; 'error' rejects like a plan limit would. */
    outcome?: 'valid' | 'unparsable' | 'empty' | 'error';
    children: Snippet;
  }

  let { outcome = 'valid', children }: Props = $props();

  const RESULTS: Record<'valid' | 'unparsable' | 'empty', MathImageConversion> = {
    valid: { latex: '\\frac{1}{2}+\\frac{1}{3}', valid: true },
    unparsable: { latex: '\\frac{1}{', valid: false, parseError: 'PARSE_FAILED' },
    empty: { latex: '', valid: false, parseError: 'NO_MATH_FOUND' }
  };

  setMathImageConverter({
    labels: DEFAULT_MATH_IMAGE_LABELS,
    convert: async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (outcome === 'error') throw new Error('Free plan image conversions are used up for this month.');

      return RESULTS[outcome];
    }
  });
</script>

{@render children()}
