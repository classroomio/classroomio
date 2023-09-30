<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { Moon } from 'svelte-loading-spinners';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import Exercise from '../Exercise/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { createExercise } from '$lib/utils/services/courses';
  import { QUESTION_TYPES } from '$lib/components/Question/constants';
  import { lesson } from '../store/lessons';
  import { questionnaire, isQuestionnaireFetching, handleAddQuestion } from '../store/exercise';
  import { exerciseMode } from '../Exercise/store';

  export let path;
  export let exerciseId;
  export let lessonId;
  export let isStudent = true;

  let open = false;
  let isFetching = false;
  let newExercise = {
    id: 1,
    title: '',
    description: ''
  };

  async function handleAddExercise() {
    const { data, error } = await createExercise({
      title: newExercise.title,
      lesson_id: lessonId
    });

    console.log(`data, error `, data, error);
    lesson.update((_lesson) => ({
      ..._lesson,
      exercises: [..._lesson.exercises, data[0]]
    }));

    handleCancelAddExercise();
  }

  function handleCancelAddExercise() {
    open = false;
    newExercise = {
      id: new Date().getTime(),
      title: '',
      description: ''
    };
  }

  async function getExercises() {
    if (!lessonId) return;
    isFetching = true;
    const exercisesData = await supabase
      .from('exercise')
      .select(`id, title, created_at`)
      .match({ lesson_id: lessonId });

    $lesson.exercises = exercisesData.data;
    isFetching = false;
  }

  async function getExercise(exerciseId) {
    if (!exerciseId) return;
    isFetching = true;
    isQuestionnaireFetching.update(() => true);

    let { data, error } = await supabase
      .from('exercise')
      .select(
        `
        id, title, description, due_by,
        questions:question(
          *,
          options:option(*),
          question_type:question_type_id(id, label)
        )
      `
      )
      .eq('id', exerciseId)
      .single();

    if (error) {
      return;
    }

    if (data && Array.isArray(data.questions)) {
      // Need to set the question type inorder for the select in the questionnaire builder to match
      data.questions.forEach((question) => {
        question.question_type = QUESTION_TYPES.find(
          (type) => type.id === question.question_type.id
        );
        return question;
      });
      data.questions = data.questions.sort((a, b) => a.order - b.order);
    } else if (data) {
      data.questions = [];
    } else {
      data = {};
    }

    data.is_title_dirty = false;
    data.is_description_dirty = false;
    data.is_due_by_dirty = false;

    questionnaire.set(data);
    console.log('getExercise', exerciseId, $questionnaire);

    isQuestionnaireFetching.update(() => false);
    isFetching = false;
  }

  function goBack() {
    goto(path);
  }

  onMount(() => {
    getExercises();
  });

  $: getExercise(exerciseId);

  $: $exerciseMode.editMode = !isStudent;
</script>

{#if isFetching}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{/if}

{#if exerciseId}
  <Exercise {exerciseId} {goBack} />
{:else}
  <Modal onClose={handleCancelAddExercise} bind:open modalHeading="Create an Exercise" width="w-80">
    <TextField bind:value={newExercise.title} autoFocus={true} placeholder="Exercise name" />

    <div class="mt-5 flex items-center">
      <PrimaryButton className="px-6 py-3" label="Submit" onClick={handleAddExercise} />
    </div>
  </Modal>

  <PageBody>
    <slot:fragment slot="header">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton className="mr-2 mb-2" label="Add" onClick={() => (open = !open)} />
      </RoleBasedSecurity>
    </slot:fragment>

    <div class="flex flex-wrap">
      {#each $lesson.exercises as exercise}
        <a
          class="w-52 bg-gray-100 dark:bg-neutral-800 px-4 py-7 mr-4 mb-4 rounded-lg"
          href="{path}/{exercise.id}"
        >
          <h3 class="dark:text-white text-xl">{exercise.title}</h3>
          <p class="dark:text-white mt-4 text-sm">Created Jul 3, 2021</p>
        </a>
      {:else}
        <Box className="mt-3 text-center">
          <div class="flex justify-between flex-col items-center w-[80%] md:w-96">
            <img src="/images/empty-exercise-icon.svg" alt="Exercise" class="my-2.5 mx-auto" />
            <h2 class="text-xl my-1.5 font-normal">No exercises added for this lesson</h2>
            <p class="text-sm text-center text-slate-500">
              Share your knowledge with the world by creating engaging exercises. Add an exercise
              now.
            </p>
          </div>
        </Box>
      {/each}
    </div>
  </PageBody>
{/if}
