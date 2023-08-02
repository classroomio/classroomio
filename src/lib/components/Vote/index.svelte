<script>
  import ArrowUpIcon from 'carbon-icons-svelte/lib/ArrowUp.svelte';
  import Chip from '../Chip/index.svelte';

  export let value = 0;
  export let upVote = () => {};
  export let disabled = false;
</script>

<button
  class="vote border-none {disabled ? 'cursor-not-allowed' : 'cursor-pointer'}"
  on:click={disabled ? undefined : upVote}
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
