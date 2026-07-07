<script lang="ts">
  import { sanitizeEmbedHtml } from '../../tools/sanitize';
  import { parseEmbedIframeDimensions } from './landing-page-utils';

  let { code }: { code: string } = $props();

  const dimensions = $derived(parseEmbedIframeDimensions(code));
  const sanitizedCode = $derived(sanitizeEmbedHtml(code));
</script>

<div
  class="landing-embed-host ui:inline-flex ui:max-w-full ui:shrink-0 ui:justify-center"
  style:width={dimensions.width}
  style:max-width="100%"
>
  <div class="landing-embed-frame ui:w-full" style:height={dimensions.height}>
    {@html sanitizedCode}
  </div>
</div>

<style>
  :global(.landing-embed-frame iframe) {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    border: 0;
  }
</style>
