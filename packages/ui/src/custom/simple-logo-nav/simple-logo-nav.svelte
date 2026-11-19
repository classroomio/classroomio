<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    tagline?: string;
    class?: string;
  }

  let { tagline = 'One Platform for Customer, Partner, and Employee Training', class: className }: Props = $props();
</script>

<div
  class={cn(
    'ui:absolute ui:top-2 ui:flex ui:flex-col ui:items-center ui:rounded-md ui:border ui:border-dashed ui:px-4 ui:py-1',
    className
  )}
>
  <a
    href="https://classroomio.com"
    target="_blank"
    rel="noopener noreferrer"
    class="ui:flex ui:items-center ui:justify-center ui:gap-2"
  >
    <img src="/logo-512.png" class="ui:h-7 ui:w-7" alt="ClassroomIO Logo" />
    <span class="ui:text-foreground ui:text-md">ClassroomIO</span>
  </a>

  <p class="ui:text-muted-foreground ui:text-sm">{tagline}</p>
</div>
