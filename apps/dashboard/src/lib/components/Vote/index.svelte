<script lang="ts">
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import { Chip } from '@cio/ui/custom/chip';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    value?: number;
    upVote?: any;
    disabled?: boolean;
  }

  let { value = 0, upVote = () => {}, disabled = false }: Props = $props();
</script>

<Button onclick={disabled ? undefined : upVote} {disabled} variant="ghost" class="h-fit! flex-col">
  <ArrowUpIcon size={16} />
  <Chip {value} />
</Button>
