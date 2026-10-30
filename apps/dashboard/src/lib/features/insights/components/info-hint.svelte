<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Tooltip from '@cio/ui/base/tooltip';

  interface Props {
    hint: string;
  }

  let { hint }: Props = $props();
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger
      aria-label={hint}
      class="ui:focus-visible:ring-ring inline-flex items-center rounded focus-visible:ring-2 focus-visible:outline-none"
    >
      <InfoIcon class="size-3 shrink-0 opacity-70 hover:opacity-100" aria-hidden="true" />
    </Tooltip.Trigger>
    <Tooltip.Content side="top" sideOffset={4} class="max-w-xs">{hint}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
