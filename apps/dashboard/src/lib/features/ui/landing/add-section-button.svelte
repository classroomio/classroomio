<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    label: string;
    onclick: () => void;
  }

  let { label, onclick }: Props = $props();
</script>

<Button type="button" variant="outline" size="sm" class="w-full justify-center gap-1.5" {onclick}>
  <PlusIcon class="size-3.5" />
  {label}
</Button>
