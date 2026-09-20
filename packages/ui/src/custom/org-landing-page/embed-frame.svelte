<script lang="ts">
  import { sanitizeEmbedHtml } from '../../tools/sanitize';
  import { parseEmbedIframeDimensions } from './landing-page-utils';

  let { code }: { code: string } = $props();
  const dimensions = $derived(parseEmbedIframeDimensions(code));

  /**
   * Embeds are browser-only: the markup is injected with `{@html}` and needs a live document.
   * Checked locally rather than via SvelteKit's `$app/environment` so this library stays usable
   * outside a SvelteKit app (Storybook resolves no `$app/*` modules for `packages/ui`).
   */
  const browser = typeof window !== 'undefined';
</script>

<div
  class="landing-embed-host ui:inline-flex ui:max-w-full ui:shrink-0 ui:justify-center"
  style:width={dimensions.width}
  style:max-width="100%"
>
  {#if browser}
    <div class="landing-embed-frame ui:w-full" style:height={dimensions.height}>
      {@html sanitizeEmbedHtml(code)}
    </div>
  {/if}
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
