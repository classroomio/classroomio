<script>
  import { goto } from '@sapper/app';
  import { onMount } from 'svelte';
  import AudioConsole32 from 'carbon-icons-svelte/lib/AudioConsole32';
  import Box from '../../../../Box/index.svelte';
  import { Firework } from 'svelte-loading-spinners';
  import Backdrop from '../../../../Backdrop/index.svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import RoleBasedSecurity from '../../../../RoleBasedSecurity/index.svelte';
  import PageBody from '../../../../PageBody/index.svelte';
  import Modal from '../../../../Modal/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
  import Exercise from '../Exercise/index.svelte';
  import { supabase } from '../../../../../utils/functions/supabase';
  import { createExercise } from '../../../../../utils/services/courses';
  import { QUESTION_TYPES } from '../../../../Question/constants';
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
    isFetching = false;
    isQuestionnaireFetching.update(() => true);

    const { data } = await supabase
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

    if (data && Array.isArray(data.questions)) {
      // Need to set the question type inorder for the select in the questionnaire builder to match
      data.questions.forEach((question) => {
        question.question_type = QUESTION_TYPES.find(
          (type) => type.id === question.question_type.id
        );
        return question;
      });
      data.questions = data.questions.sort((a, b) => a.order - b.order);
    } else {
      data.questions = [];
    }

    data.is_title_dirty = false;
    data.is_description_dirty = false;
    data.is_due_by_dirty = false;

    questionnaire.set(data);
    console.log('getExercise', exerciseId, $questionnaire);

    isQuestionnaireFetching.update(() => false);
    isFetching = true;
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
    <Firework size="60" color="#1d4ed8" unit="px" duration="1s" />
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
        className="px-6 py-2"
        label="Submit"
        onClick={handleAddExercise}
      />
    </div>
  </Modal>

  <PageBody>
    <slot:fragment slot="header">
      <RoleBasedSecurity allowedRoles="[1,2]">
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
          class="w-52 bg-gray-100 px-4 py-7 mr-4 mb-4"
          href="{path}/{exercise.id}"
        >
          <h3 class="text-xl">{exercise.title}</h3>
          <p class="mt-4 text-sm">Created Jul 3, 2021</p>
        </a>
      {:else}
        <Box>
          <AudioConsole32 class="carbon-icon w-80" />
          <h3 class="text-3xl text-gray-500">No Exercise Added</h3>
        </Box>
      {/each}
    </div>
  </PageBody>
{/if}
