<script>
  import Quizzes from '$lib/components/Org/Quiz/Quizzes.svelte';
  import NewQuizModal from '$lib/components/Org/Quiz/NewQuizModal.svelte';
  import DeleteModal from '$lib/components/Org/Quiz/DeleteModal.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { createQuizModal } from '$lib/utils/store/org';
</script>

<svelte:head>
  <title>Interactive Quizzes - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Interactive Quizzes</h1>
      <PrimaryButton
        label="Create Quiz"
        onClick={() => ($createQuizModal.open = true)}
      />
    </div>

    <NewQuizModal />
    <DeleteModal />

    <Quizzes />
  </div>
</section>
