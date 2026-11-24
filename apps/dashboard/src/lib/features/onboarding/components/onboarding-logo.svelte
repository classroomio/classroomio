<script lang="ts">
  import { cn } from '@cio/ui/tools';

  interface Props {
    tagline?: string;
    class?: string;
  }

  let { tagline, class: className }: Props = $props();
</script>

<header class={cn('flex flex-col gap-1 pt-6 md:pt-8', className)}>
  <a
    href="https://classroomio.com"
    target="_blank"
    rel="noopener noreferrer"
    class="ui:text-foreground flex w-fit shrink-0 items-center gap-2.5 whitespace-nowrap"
    aria-label="ClassroomIO"
  >
    <img src="/logo.svg" class="h-6 w-[33px] shrink-0" alt="" />
    <span class="text-[22px] leading-none font-extrabold tracking-[-0.03em]">classroomio</span>
  </a>
  {#if tagline}
    <p class="ui:text-muted-foreground text-sm">{tagline}</p>
  {/if}
</header>
