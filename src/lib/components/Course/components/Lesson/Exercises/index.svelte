<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import AudioConsoleIcon from 'carbon-icons-svelte/lib/AudioConsole.svelte';
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
  import { questionnaire, isQuestionnaireFetching } from '../store/exercise';

  export let path;
  export let exerciseId;
  export let lessonId;

  let open = false;
  let isFetching = false;
  let newExercise = {
    id: 1,
    title: '',
    description: '',
  };

  async function handleAddExercise() {
    const { data, error } = await createExercise({
      title: newExercise.title,
      lesson_id: lessonId,
    });

    console.log(`data, error `, data, error);
    lesson.update((_lesson) => ({
      ..._lesson,
      exercises: [..._lesson.exercises, data[0]],
    }));

    handleCancelAddExercise();
  }

  function handleCancelAddExercise() {
    open = false;
    newExercise = {
      id: $lesson.exercises.length + 1,
      title: '',
      description: '',
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
</script>

{#if isFetching}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{/if}

{#if exerciseId}
  <Exercise
    {exerciseId}
    {goBack}
    refetchExercise={() => getExercise(exerciseId)}
  />
{:else}
  <Modal
    onClose={handleCancelAddExercise}
    bind:open
    modalHeading="Create an Exercise"
    width="w-80"
  >
    <TextField
      bind:value={newExercise.title}
      autofocus={true}
      placeholder="Exercise name"
    />

    <div class="mt-5 flex items-center">
      <PrimaryButton
        className="px-6 py-3"
        label="Submit"
        onClick={handleAddExercise}
      />
    </div>
  </Modal>

  <PageBody>
    <slot:fragment slot="header">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="mr-2"
          label="Add"
          onClick={() => (open = !open)}
        />
      </RoleBasedSecurity>
    </slot:fragment>

    <div class="flex flex-wrap">
      {#each $lesson.exercises as exercise}
        <a
          class="w-52 bg-gray-100 dark:bg-gray-700 px-4 py-7 mr-4 mb-4"
          href="{path}/{exercise.id}"
        >
          <h3 class="dark:text-white text-xl">{exercise.title}</h3>
          <p class="dark:text-white mt-4 text-sm">Created Jul 3, 2021</p>
        </a>
      {:else}
        <Box>
          <AudioConsoleIcon size={32} class="carbon-icon w-80" />
          <h3 class="text-3xl text-gray-500 dark:text-white">
            No Exercise Added
          </h3>
        </Box>
      {/each}
    </div>
  </PageBody>
{/if}
