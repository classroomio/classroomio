<script lang="ts">
  import { renderMathText } from '@cio/utils/math';
  import { renderLatexToHtml } from '../../tools/render-math';

  interface Props {
    /** Plain string; `$…$`, `$$…$$` and editor `data-latex` elements render as math, the rest as escaped text. */
    text: string;
  }

  let { text }: Props = $props();

  const html = $derived(renderMathText(text, renderLatexToHtml));
</script>

{@html html}
