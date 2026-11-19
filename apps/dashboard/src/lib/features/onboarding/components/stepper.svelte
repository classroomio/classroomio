<script lang="ts">
  interface Props {
    current: number;
    total: number;
    stepText: string;
    label: string;
  }

  let { current, total, stepText, label }: Props = $props();

  const segments = $derived(Array.from({ length: total }, (_, index) => index));
</script>

<div class="flex w-full flex-col gap-3">
  <div class="flex items-center justify-between text-[11px] font-semibold tracking-[0.14em] uppercase">
    <span class="ui:text-muted-foreground">{stepText}</span>
    <span class="ui:text-primary">{label}</span>
  </div>

  <div class="flex gap-1.5">
    {#each segments as segment (segment)}
      <span class={segment < current ? 'ui:bg-primary h-1 flex-1 rounded-full' : 'ui:bg-muted h-1 flex-1 rounded-full'}
      ></span>
    {/each}
  </div>
</div>
