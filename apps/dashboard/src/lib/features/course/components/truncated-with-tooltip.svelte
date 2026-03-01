<script lang="ts">
  import * as Tooltip from '@cio/ui/base/tooltip';

  interface Props {
    text: string;
    maxWidth?: string;
    class?: string;
  }

  let { text, maxWidth = '100px', class: className = '' }: Props = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    <span class="block truncate px-1 {className}" style={maxWidth ? `max-width: ${maxWidth}` : undefined}>
      {text}
    </span>
  </Tooltip.Trigger>
  <Tooltip.Content side="top" sideOffset={4}>
    {text}
  </Tooltip.Content>
</Tooltip.Root>
