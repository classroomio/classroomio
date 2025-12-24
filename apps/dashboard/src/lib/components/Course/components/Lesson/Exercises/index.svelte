<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, untrack } from 'svelte';
  import { Spinner } from '@cio/ui/base/spinner';
  import { lesson } from '../store/lessons';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import { supabase } from '$lib/utils/functions/supabase';

  import type { ExerciseTemplate, Exercise as ExerciseType } from '$lib/utils/types';
  import { formatDate } from '$lib/utils/functions/routes/dashboard';
  import { isQuestionnaireFetching, questionnaire } from '../store/exercise';
  import { createExercise, createExerciseFromTemplate } from '$lib/utils/services/courses';

  import Exercise from '../Exercise/index.svelte';
  import { Backdrop, RoleBasedSecurity } from '$features/ui';
  import * as Empty from '@cio/ui/base/empty';
  import { QUESTION_TYPES } from '$lib/components/Question/constants';
  import { Button } from '@cio/ui/base/button';
  import NewExerciseModal from '$lib/components/Course/components/Lesson/Exercises/NewExerciseModal.svelte';

  interface Props {
    path?: string;
    exerciseId?: string;
    lessonId?: string;
  }

  let { path = $bindable(''), exerciseId = '', lessonId = '' }: Props = $props();

  let open = $state(false);
  let isFetching = $state(false);
  let newExercise = $state({
    id: 1,
    title: '',
    description: ''
  });

  async function handleTemplateCreate(template: ExerciseTemplate): Promise<void> {
    const newExercise = (await createExerciseFromTemplate(lessonId, template)) as ExerciseType;
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

    if (!data) return;

    console.log(`data, error `, data, error);
    const insertedExercise = data?.[0] as ExerciseType;
    lesson.update((_lesson) => ({
      ..._lesson,
      exercises: [..._lesson.exercises, insertedExercise]
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

  function getExercises(lId: string | undefined) {
    if (!lId) return;

    untrack(async () => {
      isFetching = true;

      const exercisesData = await supabase.from('exercise').select(`id, title, created_at`).match({ lesson_id: lId });

      $lesson.exercises = exercisesData.data as ExerciseType[];
      isFetching = false;
    });
  }

  async function getExercise(exerciseId: string | undefined) {
    if (!exerciseId) return;

    untrack(async () => {
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
          question.question_type = QUESTION_TYPES.find((type) => type.id === question.question_type.id);
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
        questions: Array.isArray(data?.questions) ? data?.questions : [],
        totalSubmissions: data?.totalSubmissions?.[0]?.count || 0
      });

      isQuestionnaireFetching.update(() => false);
      isFetching = false;
    });
  }

  function goBack() {
    goto(path);
  }

  onMount(() => {
    getExercises(lessonId);
  });

  $effect(() => {
    getExercise(exerciseId);
  });
</script>

{#if isFetching}
  <Backdrop>
    <Spinner class="size-14! text-blue-700!" />
  </Backdrop>
{/if}

{#if exerciseId}
  <Exercise {exerciseId} {goBack} {path} {isFetching} />
{:else}
  <NewExerciseModal
    bind:open
    {handleCancelAddExercise}
    {handleAddExercise}
    {handleTemplateCreate}
    bind:title={newExercise.title}
  />

  <div>
    {#snippet header()}
      <slot:fragment>
        <Breadcrumb.Root class="my-2">
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href={path}>
                {$t('course.navItem.lessons.exercises.heading')}
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <Button class="my-2 mr-2" onclick={() => (open = !open)}>
            {$t('course.navItem.lessons.exercises.add_button')}
          </Button>
        </RoleBasedSecurity>
      </slot:fragment>
    {/snippet}

    <div class="mt-5 flex flex-wrap">
      {#each $lesson.exercises as exercise}
        <a class="mb-4 mr-4 w-52 rounded-lg bg-gray-100 px-4 py-7 dark:bg-neutral-800" href="{path}/{exercise.id}">
          <h3 class="text-xl dark:text-white">{exercise.title}</h3>
          <p class="mt-4 text-sm dark:text-white">{formatDate(exercise.created_at)}</p>
        </a>
      {:else}
        <Empty.Root class="mt-3">
          <Empty.Header>
            <Empty.Media variant="icon">
              <img src="/images/empty-exercise-icon.svg" alt="Exercise" class="size-6" />
            </Empty.Media>
            <Empty.Title>
              {$t('course.navItem.lessons.exercises.no_exercises')}
            </Empty.Title>
            <Empty.Description>
              {#if $globalStore.isStudent}
                {$t('course.navItem.lessons.exercises.no_assigned_exercises')}
                <strong> {$t('course.navItem.lessons.exercises.chill')} :)</strong>
              {:else}
                {$t('course.navItem.lessons.exercises.add_exercise')}
              {/if}
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {/each}
    </div>
  </div>
{/if}
