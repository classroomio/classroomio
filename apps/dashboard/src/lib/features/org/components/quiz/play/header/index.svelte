<script lang="ts">
  import { quizStore } from '$lib/utils/store/org';
  import Answer from './answer.svelte';
  import Timer from './timer.svelte';

  interface Props {
    startCount?: boolean;
    showCountDown?: boolean;
  }

  let { startCount = false, showCountDown = false }: Props = $props();
</script>

<div class="flex w-full items-center justify-between">
  <h3 class="text-white">{$quizStore.title}</h3>
  {#if showCountDown}
    <div class="flex">
      <Timer {startCount} timelimit={$quizStore.timelimit} />
      <Answer />
    </div>
  {/if}
</div>
