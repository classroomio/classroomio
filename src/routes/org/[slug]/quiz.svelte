<script>
  import Quizzes from '../../../components/Org/Quiz/Quizzes.svelte';
  import NewQuizModal from '../../../components/Org/Quiz/NewQuizModal.svelte';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import { createQuizModal } from '../../../utils/store/org';

  async function getCourses(userId) {}

  // $: getCourses($profile.id);
</script>

<svelte:head>
  <title>Interactive Quizes - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Interactive Quizes</h1>
      <PrimaryButton
        label="Create Quiz"
        onClick={() => ($createQuizModal.open = true)}
      />
    </div>

    <NewQuizModal />

    <Quizzes />
  </div>
</section>
