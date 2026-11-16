<script lang="ts">
  import { formatMathDisplay } from '@cio/question-types';
  import { renderMathText } from '@cio/utils/math';
  import { renderLatexToHtml } from '../../tools/render-math';
  import { mathNotation } from './notation';

  interface Props {
    /** Plain string; `$…$`, `$$…$$` and editor `data-latex` elements render as math, the rest as escaped text. */
    text: string;
  }

  let { text }: Props = $props();

  const html = $derived(
    renderMathText(text, (latex, display) => renderLatexToHtml(formatMathDisplay(latex, $mathNotation), display))
  );
</script>

{@html html}
