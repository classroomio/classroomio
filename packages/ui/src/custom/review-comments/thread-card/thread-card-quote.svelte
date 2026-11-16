<script lang="ts">
  import { cn } from '../../../tools';

  interface Props {
    text: string;
    /** The quoted text is no longer in the content. */
    removed?: boolean;
    class?: string;
  }

  let { text, removed = false, class: className }: Props = $props();
</script>

<blockquote
  data-slot="review-thread-card-quote"
  class={cn(
    'ui:mb-2.5 ui:border-l-[3px] ui:border-amber-400 ui:px-2.5 ui:py-0.5 ui:text-[13px] ui:text-muted-foreground ui:break-words',
    removed && 'ui:line-through ui:opacity-80',
    className
  )}
>
  {text}
</blockquote>
