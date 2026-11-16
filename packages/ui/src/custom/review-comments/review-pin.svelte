<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    /** Position inside the pinned box, in percent of its width and height. */
    x: number;
    y: number;
    number?: number;
    label: string;
    active?: boolean;
    /** A pin for a comment that is still being written. */
    draft?: boolean;
    hovered?: boolean;
    onclick?: () => void;
    class?: string;
  }

  let {
    x,
    y,
    number,
    label,
    active = false,
    draft = false,
    hovered = false,
    onclick,
    class: className
  }: Props = $props();
</script>

<button
  type="button"
  data-slot="review-pin"
  aria-label={label}
  aria-pressed={active}
  class={cn('ui:absolute ui:size-0 ui:cursor-pointer ui:border-0 ui:bg-transparent ui:p-0', className)}
  style:left="{x}%"
  style:top="{y}%"
  onclick={(event) => {
    event.stopPropagation();
    onclick?.();
  }}
>
  <span
    class={cn(
      'ui:absolute ui:-top-7.5 ui:-left-2.75 ui:grid ui:size-5.5 ui:-rotate-45 ui:place-items-center ui:rounded-[50%_50%_50%_0] ui:text-[11px] ui:shadow-md ui:transition-shadow',
      draft
        ? 'ui:border-2 ui:border-dashed ui:border-destructive ui:bg-background ui:text-destructive'
        : 'ui:bg-destructive ui:text-white',
      (active || hovered) && 'ui:ring-2 ui:ring-destructive ui:ring-offset-2 ui:ring-offset-background'
    )}
  >
    <b class="ui:rotate-45 ui:font-semibold">{number ?? ''}</b>
  </span>
</button>
