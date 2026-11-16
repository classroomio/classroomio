<script lang="ts">
  import { cn } from '../../tools';
  import { getReviewInitials, getReviewPresenceColor } from './presence-colors';

  interface Props {
    name: string;
    colorIndex: number;
    /** For example "Ada is typing…". */
    label: string;
    text: string;
    class?: string;
  }

  let { name, colorIndex, label, text, class: className }: Props = $props();

  const color = $derived(getReviewPresenceColor(colorIndex));
</script>

<div
  data-slot="typing-preview"
  aria-live="polite"
  class={cn('ui:mt-2 ui:flex ui:gap-2 ui:rounded-lg ui:border ui:border-dashed ui:px-2.5 ui:py-2', className)}
  style:border-color={color}
  style:background-color="color-mix(in oklch, {color} 8%, transparent)"
>
  <span
    class="ui:grid ui:size-6 ui:shrink-0 ui:place-items-center ui:rounded-full ui:text-[10px] ui:font-semibold ui:text-white"
    style:background-color={color}
    aria-hidden="true"
  >
    {getReviewInitials(name)}
  </span>
  <div class="ui:min-w-0 ui:flex-1">
    <p class="ui:text-[11px] ui:font-semibold" style:color>{label}</p>
    <p class="ui:mt-0.5 ui:text-sm ui:leading-snug ui:break-words ui:text-foreground">
      {text}<span
        class="ui:ml-px ui:inline-block ui:h-[1em] ui:w-[1.5px] ui:animate-pulse ui:align-text-bottom"
        style:background-color={color}
      ></span>
    </p>
  </div>
</div>
