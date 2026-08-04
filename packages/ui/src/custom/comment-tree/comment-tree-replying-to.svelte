<script lang="ts">
  import CornerDownRightIcon from '@lucide/svelte/icons/corner-down-right';

  interface Props {
    label: string;
    class?: string;
  }

  let { label, class: className = '' }: Props = $props();
</script>

<p class="ui:flex ui:items-center ui:gap-1 ui:text-xs ui:text-muted-foreground {className}">
  <CornerDownRightIcon class="ui:size-3 ui:shrink-0" aria-hidden="true" />
  <span class="ui:truncate">{label}</span>
</p>
