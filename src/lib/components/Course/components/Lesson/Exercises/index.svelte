<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { Breadcrumb, BreadcrumbItem } from 'carbon-components-svelte';
  import { Moon } from 'svelte-loading-spinners';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Exercise from '../Exercise/index.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { createExercise, createExerciseFromTemplate } from '$lib/utils/services/courses';
  import { QUESTION_TYPES } from '$lib/components/Question/constants';
  import { lesson } from '../store/lessons';
  import { questionnaire, isQuestionnaireFetching } from '../store/exercise';
  import NewExerciseModal from '$lib/components/Course/components/Lesson/Exercises/NewExerciseModal.svelte';
  import type { ExerciseTemplate } from '$lib/utils/types';

  export let path = '';
  export let exerciseId = '';
  export let lessonId = '';
  export let isStudent = true;

  let open = false;
  let isFetching = false;
  let newExercise = {
    id: 1,
    title: '',
    description: ''
  };

  async function handleTemplateCreate(template: ExerciseTemplate): Promise<void> {
    const newExercise = await createExerciseFromTemplate(lessonId, template);
    console.log('newExercise', newExercise);
    if (newExercise) {
      lesson.update((_lesson) => ({
        ..._lesson,
        exercises: [..._lesson.exercises, newExercise]
      }));

      handleCancelAddExercise();
      goto(path + '/' + newExercise.id);
    }
  }

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

  async function getExercise(exerciseId: string | undefined) {
    if (!exerciseId) return;
    isFetching = true;
    isQuestionnaireFetching.update(() => true);

    let { data, error } = await supabase
      .from('exercise')
      .select(
        `
        id, title, description, due_by,
        totalSubmissions:submission(count),
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
    }

    questionnaire.set({
      ...(data || {}),
      is_title_dirty: false,
      is_description_dirty: false,
      is_due_by_dirty: false,
      questions: Array.isArray(data.questions) ? data.questions : [],
      totalSubmissions: data?.totalSubmissions?.[0]?.count || 0
    });

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
  <Exercise {exerciseId} {goBack} bind:path bind:isStudent />
{:else}
  <NewExerciseModal
    bind:open
    {handleCancelAddExercise}
    {handleAddExercise}
    {handleTemplateCreate}
    bind:title={newExercise.title}
  />

  <PageBody bind:isPageNavHidden={isStudent}>
    <slot:fragment slot="header">
      <Breadcrumb class="my-2">
        <BreadcrumbItem href={path}>All Exercises</BreadcrumbItem>
      </Breadcrumb>
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton className="mr-2 my-2" label="Add" onClick={() => (open = !open)} />
      </RoleBasedSecurity>
    </slot:fragment>

    <div class="flex flex-wrap mt-5">
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
              {#if isStudent}
                Your tutor hasn't assigned any exercise to this lesson. For the main time, you can
                <strong>chill with the big boys :)</strong>
              {:else}
                Share your knowledge with the world by creating engaging exercises. Add an exercise
                now.
              {/if}
            </p>
          </div>
        </Box>
      {/each}
    </div>
  </PageBody>
{/if}
