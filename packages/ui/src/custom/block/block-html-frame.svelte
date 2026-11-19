<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    html: string;
    src: string;
    title: string;
    interactive: boolean;
    class?: string;
  }

  let { html, src, title, interactive, class: className = '' }: Props = $props();

  let frame = $state<HTMLIFrameElement | null>(null);

  function handleMessage(event: MessageEvent) {
    if (!frame || event.source !== frame.contentWindow || event.data?.type !== 'cio-html-block:ready') return;

    // The frame runs in an opaque origin (no allow-same-origin), so '*' is the only target origin that reaches it.
    frame.contentWindow?.postMessage({ type: 'cio-html-block:render', html }, '*');
  }
</script>

<svelte:window onmessage={handleMessage} />

{#key html}
  <iframe
    bind:this={frame}
    {src}
    {title}
    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
    referrerpolicy="no-referrer"
    tabindex={interactive ? 0 : -1}
    class={cn(
      'ui:block ui:h-full ui:w-full ui:border-0 ui:bg-white',
      !interactive && 'ui:pointer-events-none',
      className
    )}
  ></iframe>
{/key}
