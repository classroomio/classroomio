<script lang="ts">
  import { cn } from '../../../tools';

  interface Props {
    dots?: boolean;
    class?: string;
  }

  let { dots = true, class: className }: Props = $props();
</script>

<div aria-hidden="true" class={cn('ui:pointer-events-none ui:absolute ui:inset-0 ui:overflow-hidden', className)}>
  <div
    class="ui:absolute ui:inset-0 ui:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_10%,transparent)_0%,color-mix(in_srgb,var(--primary)_5%,transparent)_35%,transparent_70%)]"
  ></div>
  {#if dots}
    <div
      class="ui:absolute ui:inset-0 ui:bg-[radial-gradient(color-mix(in_srgb,var(--primary)_18%,transparent)_1.2px,transparent_1.2px)] ui:bg-size-[18px_18px] ui:[mask-image:radial-gradient(ellipse_60%_55%_at_50%_25%,#000_0%,transparent_75%)]"
    ></div>
  {/if}
</div>
