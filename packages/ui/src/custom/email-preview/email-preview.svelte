<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    html: string;
    class?: string;
  }

  let { html, class: className }: Props = $props();

  let iframeElement = $state<HTMLIFrameElement | null>(null);

  $effect(() => {
    const doc = iframeElement?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  });
</script>

<div
  class={cn(
    'ui:relative ui:flex ui:h-full ui:w-full ui:items-start ui:justify-center ui:overflow-auto ui:bg-zinc-100 ui:p-4',
    className
  )}
>
  <iframe
    bind:this={iframeElement}
    title="Email preview"
    sandbox="allow-same-origin"
    class="ui:h-auto ui:w-full ui:max-w-[600px] ui:rounded-sm ui:border-0 ui:shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
    style="min-height: 600px"
  ></iframe>
</div>
