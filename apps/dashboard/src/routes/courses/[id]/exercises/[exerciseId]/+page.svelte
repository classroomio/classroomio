<script lang="ts">
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Empty } from '@cio/ui/custom/empty';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { ExercisePage } from '$features/course/pages';
  import {
    questionnaire,
    questionnaireMetaData,
    clearQuestionnaireValidation,
    reset
  } from '$lib/features/course/components/exercise/store.js';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import type { Question } from '$features/course/types';

  let { data = $bindable() } = $props();

  const path = `/courses/${data.courseId}/lessons`;
  const isLockedForStudent = $derived($globalStore.isStudent && data.exercise?.isUnlocked === false);

  $effect(() => {
    if (!data.exercise || isLockedForStudent) return;

    const meta = get(questionnaireMetaData);
    if (meta.isFinished && meta.exerciseId === data.exerciseId) {
      return;
    }
    if (meta.exerciseId != null && meta.exerciseId !== data.exerciseId) {
      reset();
    }

    clearQuestionnaireValidation();

    const exercise = data.exercise;

    // Transform questions and set questionnaire store
    let questions: Question[] = [];
    if (exercise.questions && Array.isArray(exercise.questions)) {
      questions = exercise.questions
        .map((question) => {
          const questionType = QUESTION_TYPES.find((type) => type.id === question.questionType?.id);
          return {
            ...question,
            questionType: questionType || question.questionType
          };
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    questionnaire.set({
      title: exercise.title,
      description: exercise.description,
      dueBy: exercise.dueBy,
      isTitleDirty: false,
      isDescriptionDirty: false,
      isDueByDirty: false,
      questions: questions,
      totalSubmissions: 0
    });
    questionnaireMetaData.update((m) => ({ ...m, exerciseId: data.exerciseId }));
  });
</script>

{#if isLockedForStudent}
  <Empty
    title={$t('course.navItem.lessons.content_locked_title')}
    description={$t('course.navItem.lessons.content_locked_description')}
    icon={LockIcon}
    variant="page"
    class="text-center"
  />
{:else}
  <ExercisePage exerciseId={data.exerciseId} goBack={() => goto(resolve(path, {}))} isFetching={false} />
{/if}
