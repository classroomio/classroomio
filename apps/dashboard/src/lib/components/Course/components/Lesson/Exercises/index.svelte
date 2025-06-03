<script lang="ts">
  import { goto } from '$app/navigation';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import NewExerciseModal from '$lib/components/Course/components/Lesson/Exercises/NewExerciseModal.svelte';
  import { PageBody } from '$lib/components/Page';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { QUESTION_TYPES } from '$lib/components/Question/constants';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { formatDate } from '$lib/utils/functions/routes/dashboard';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { createExercise, createExerciseFromTemplate } from '$lib/utils/services/courses';
  import { globalStore } from '$lib/utils/store/app';
  import type { ExerciseTemplate } from '$lib/utils/types';
  import { Breadcrumb, BreadcrumbItem } from 'carbon-components-svelte';
  import { onMount } from 'svelte';
  import { Moon } from 'svelte-loading-spinners';
  import Exercise from '../Exercise/index.svelte';
  import { isQuestionnaireFetching, questionnaire } from '../store/exercise';
  import { lesson } from '../store/lessons';

  export let path = '';
  export let exerciseId = '';
  export let lessonId = '';

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
  <Exercise {exerciseId} {goBack} bind:path {isFetching} />
{:else}
  <NewExerciseModal
    bind:open
    {handleCancelAddExercise}
    {handleAddExercise}
    {handleTemplateCreate}
    bind:title={newExercise.title}
  />

  <PageBody bind:isPageNavHidden={$globalStore.isStudent}>
    <slot:fragment slot="header">
      <Breadcrumb class="my-2">
        <BreadcrumbItem href={path}>{$t('course.navItem.lessons.exercises.heading')}</BreadcrumbItem
        >
      </Breadcrumb>
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="mr-2 my-2"
          label={$t('course.navItem.lessons.exercises.add_button')}
          onClick={() => (open = !open)}
        />
      </RoleBasedSecurity>
    </slot:fragment>

    <div class="flex flex-wrap mt-5">
      {#each $lesson.exercises as exercise}
        <a
          class="w-52 bg-gray-100 dark:bg-neutral-800 px-4 py-7 mr-4 mb-4 rounded-lg"
          href="{path}/{exercise.id}"
        >
          <h3 class="dark:text-white text-xl">{exercise.title}</h3>
          <p class="dark:text-white mt-4 text-sm">{formatDate(exercise.created_at)}</p>
        </a>
      {:else}
        <Box className="mt-3 text-center">
          <div class="flex justify-between flex-col items-center w-[80%] md:w-96">
            <img src="/images/empty-exercise-icon.svg" alt="Exercise" class="my-2.5 mx-auto" />
            <h2 class="text-xl my-1.5 font-normal">
              {$t('course.navItem.lessons.exercises.no_exercises')}
            </h2>
            <p class="text-sm text-center text-slate-500">
              {#if $globalStore.isStudent}
                {$t('course.navItem.lessons.exercises.no_assigned_exercises')}
                <strong> {$t('course.navItem.lessons.exercises.chill')} :)</strong>
              {:else}
                {$t('course.navItem.lessons.exercises.add_exercise')}
              {/if}
            </p>
          </div>
        </Box>
      {/each}
    </div>
  </PageBody>
{/if}
