<script lang="ts">
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import Chip from '../Chip/index.svelte';

  interface Props {
    value?: number;
    upVote?: any;
    disabled?: boolean;
  }

  let { value = 0, upVote = () => {}, disabled = false }: Props = $props();
</script>

<button
  class="vote border-none {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
  onclick={disabled ? undefined : upVote}
>
  <ArrowUpIcon size={16} />
  <Chip {value} />
</button>

<style>
  .vote {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 25px;
    width: 25px;
    justify-content: center;
    margin-right: 10px;
  }
</style>
