<script>
  import Quizzes from '$lib/components/Org/Quiz/Quizzes.svelte';
  import NewQuizModal from '$lib/components/Org/Quiz/NewQuizModal.svelte';
  import DeleteModal from '$lib/components/Org/Quiz/DeleteModal.svelte';
  import { Button } from '@cio/ui/base/button';
  import { createQuizModal } from '$lib/utils/store/org';
  import { isMobile } from '$lib/utils/store/useMobile';
  import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<svelte:head>
  <title>Interactive Quizzes - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full max-w-6xl">
  <div class="px-5 py-10">
    <div class="mb-10 flex items-center justify-between">
      <h1 class="text-2xl md:text-3xl dark:text-white">Interactive Quizzes</h1>
      {#if $isMobile}
        <Button onclick={() => ($createQuizModal.open = true)}>
          <PlusIcon size={16} />
        </Button>
      {:else}
        <Button onclick={() => ($createQuizModal.open = true)}>Create Quiz</Button>
      {/if}
    </div>

    <NewQuizModal />
    <DeleteModal />

    <Quizzes />
  </div>
</section>
