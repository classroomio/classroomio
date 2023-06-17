<script>
  import { quizStore } from '../../../../../utils/store/org';
  import Answer from './Answer.svelte';
  import Timer from './Timer.svelte';

  export let startCount = false;
  export let showCountDown = false;
</script>

<div class="flex justify-between items-center w-full">
  <h3 class="text-white">{$quizStore.title}</h3>
  {#if showCountDown}
    <div class="flex">
      <Timer {startCount} timelimit={$quizStore.timelimit} />
      <Answer />
    </div>
  {/if}
</div>
