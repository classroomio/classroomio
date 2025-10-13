<script>
  import Quizzes from '$lib/components/Org/Quiz/Quizzes.svelte';
  import NewQuizModal from '$lib/components/Org/Quiz/NewQuizModal.svelte';
  import DeleteModal from '$lib/components/Org/Quiz/DeleteModal.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
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
      <h1 class="text-2xl font-bold md:text-3xl dark:text-white">Interactive Quizzes</h1>
      {#if $isMobile}
        <PrimaryButton onClick={() => ($createQuizModal.open = true)}>
          <PlusIcon />
        </PrimaryButton>
      {:else}
        <PrimaryButton label="Create Quiz" onClick={() => ($createQuizModal.open = true)} />
      {/if}
    </div>

    <NewQuizModal />
    <DeleteModal />

    <Quizzes />
  </div>
</section>
