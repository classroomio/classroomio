<script lang="ts">
  import { splitHtmlAndSvg, type ContentSegment } from '../../tools/sanitize';

  interface Props {
    content: string;
  }

  let { content }: Props = $props();

  const segments: ContentSegment[] = $derived(splitHtmlAndSvg(content));

  function svgDimensions(svg: string): { width: string; height: string } {
    const widthMatch = svg.match(/\bwidth\s*=\s*["'](\d+)/i);
    const heightMatch = svg.match(/\bheight\s*=\s*["'](\d+)/i);
    return {
      width: widthMatch ? `${widthMatch[1]}px` : '100%',
      height: heightMatch ? `${heightMatch[1]}px` : '150px'
    };
  }

  function svgSrcdoc(rawSvg: string): string {
    return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;justify-content:center}</style></head><body>${rawSvg}</body></html>`;
  }
</script>

{#key content}
  {#each segments as segment, i (i)}
    {#if segment.type === 'html'}
      {@html segment.content}
    {:else}
      {@const dims = svgDimensions(segment.content)}
      <iframe
        sandbox=""
        srcdoc={svgSrcdoc(segment.content)}
        title="Embedded diagram"
        style="border:none;overflow:hidden;width:{dims.width};height:{dims.height}"
      ></iframe>
    {/if}
  {/each}
{/key}
