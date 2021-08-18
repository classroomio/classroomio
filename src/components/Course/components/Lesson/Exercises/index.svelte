<script>
  import { onMount } from 'svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
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
    const exercisesData = await supabase
      .from('exercise')
      .select(`id, title, created_at`)
      .match({ lesson_id: lessonId });

    $lesson.exercises = exercisesData.data;
  }

  async function getExercise(exerciseId) {
    console.log('getExercise', exerciseId);

    if (!exerciseId) return;

    isQuestionnaireFetching.update(() => true);

    const { data } = await supabase
      .from('exercise')
      .select(
        `
        id, title, description,
        questions:question(
          *,
          options:option(*),
          question_type:question_type_id(id, label)
        )
      `
      )
      .eq('id', exerciseId)
      .single();

    // Need to set the question type inorder for the select in the questionnaire builder to match
    data.questions.forEach((question) => {
      question.question_type = QUESTION_TYPES.find(
        (type) => type.id === question.question_type.id
      );
      return question;
    });

    data.is_title_dirty = false;
    data.is_description_dirty = false;

    questionnaire.set(data);
    console.log('getExercise', exerciseId, $questionnaire);

    isQuestionnaireFetching.update(() => false);
  }

  onMount(() => {
    getExercises();
  });

  $: getExercise(exerciseId);
</script>

{#if exerciseId}
  <Exercise {exerciseId} />
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

  <PageBody width="w-11/12 m-auto">
    <slot:fragment slot="header">
      <PrimaryButton
        className="mr-2"
        label="Add"
        onClick={() => (open = !open)}
      />
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
      {/each}
    </div>
  </PageBody>
{/if}
