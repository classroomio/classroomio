<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    src: string;
    title: string;
    class?: string;
  }

  let { src, title, class: className = '' }: Props = $props();
</script>

<div class={cn('ui:bg-muted ui:relative ui:aspect-video ui:w-full ui:overflow-hidden ui:rounded-md', className)}>
  <iframe
    {src}
    {title}
    class="ui:absolute ui:inset-0 ui:h-full ui:w-full ui:border-0"
    allow="fullscreen"
    allowfullscreen
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
</div>
