<script lang="ts">
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { Spinner } from '@cio/ui/base/spinner';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import { exerciseApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import debounce from 'lodash/debounce';

  import { formatDate } from '$lib/utils/functions/routes/dashboard';
  import { isQuestionnaireFetching, questionnaire, questionnaireValidation } from '../store/exercise';

  import Exercise from '../exercise/index.svelte';
  import { Backdrop, RoleBasedSecurity } from '$features/ui';
  import * as Empty from '@cio/ui/base/empty';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { Button } from '@cio/ui/base/button';
  import NewExerciseModal from './new-exercise-modal.svelte';

  interface Props {
    path?: string;
    exerciseId?: string;
    lessonId?: string;
  }

  let { path = $bindable(''), exerciseId = '', lessonId = '' }: Props = $props();

  let open = $state(false);
  let newExercise = $state({
    id: 1,
    title: '',
    description: ''
  });

  async function handleTemplateCreate(templateId: number): Promise<void> {
    await exerciseApi.createFromTemplate(courseApi.course?.id!, lessonId, templateId);

    if (exerciseApi.success && exerciseApi.exercise) {
      const newExercise = exerciseApi.exercise;
      // Add to exercises list if not already present
      if (!exerciseApi.exercises.find((ex) => ex.id === newExercise.id)) {
        exerciseApi.exercises = [...exerciseApi.exercises, newExercise];
      }

      handleCancelAddExercise();
      goto(path + '/' + newExercise.id);
    }
  }

  async function handleAddExercise() {
    const courseId = courseApi.course?.id!;
    await exerciseApi.create(courseId, {
      title: newExercise.title,
      lessonId: lessonId,
      courseId: courseId
    });

    if (exerciseApi.success && exerciseApi.exercise) {
      const insertedExercise = exerciseApi.exercise;
      // Add to exercises list if not already present
      if (!exerciseApi.exercises.find((ex) => ex.id === insertedExercise.id)) {
        exerciseApi.exercises = [...exerciseApi.exercises, insertedExercise];
      }

      handleCancelAddExercise();
    }
  }

  function handleCancelAddExercise() {
    open = false;
    newExercise = {
      id: new Date().getTime(),
      title: '',
      description: ''
    };
  }

  async function getExercise(exerciseId: string) {
    untrack(async () => {
      isQuestionnaireFetching.update(() => true);

      questionnaireValidation.set({});

      await exerciseApi.get(courseApi.course?.id!, exerciseId);

      if (exerciseApi.success && exerciseApi.exercise) {
        const data = exerciseApi.exercise;

        // Transform questions to match expected format
        let questions: any[] = [];
        if (data.questions && Array.isArray(data.questions)) {
          questions = data.questions
            .map((question) => {
              // Need to set the question type in order for the select in the questionnaire builder to match
              const questionType = QUESTION_TYPES.find((type) => type.id === question.questionType?.id);
              return {
                ...question,
                questionType: questionType || question.questionType
              };
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        questionnaire.set({
          // id: data.id,
          title: data.title,
          description: data.description,
          dueBy: data.dueBy,
          isTitleDirty: false,
          isDescriptionDirty: false,
          isDueByDirty: false,
          questions: questions,
          totalSubmissions: 0 // TODO: Get from submission count if needed
        });

        questionnaireValidation.set({});
      }

      isQuestionnaireFetching.update(() => false);
    });
  }
  const debouncedGetExercise = debounce(getExercise, 1000);

  function goBack() {
    goto(path);
  }

  $effect(() => {
    if (exerciseId || !courseApi.course?.id || !lessonId) return;

    exerciseApi.list(courseApi.course?.id!, lessonId);
  });

  $effect(() => {
    if (!exerciseId) return;
    debouncedGetExercise(exerciseId);
  });
</script>

{#if exerciseApi.isLoading}
  <Backdrop>
    <Spinner class="size-14! text-blue-700!" />
  </Backdrop>
{/if}

{#if exerciseId}
  <Exercise {exerciseId} {goBack} {path} isFetching={exerciseApi.isLoading} />
{:else}
  <NewExerciseModal
    bind:open
    {handleCancelAddExercise}
    {handleAddExercise}
    {handleTemplateCreate}
    bind:title={newExercise.title}
    courseId={courseApi.course?.id!}
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

    {@render header()}

    <div class="mt-5 flex flex-wrap">
      {#each exerciseApi.exercises as exercise}
        <a class="mr-4 mb-4 w-52 rounded-lg bg-gray-100 px-4 py-7 dark:bg-neutral-800" href="{path}/{exercise.id}">
          <h3 class="text-xl dark:text-white">{exercise.title}</h3>
          <p class="mt-4 text-sm dark:text-white">{formatDate(exercise.createdAt || undefined)}</p>
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
