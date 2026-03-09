<script lang="ts">
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Empty } from '@cio/ui/custom/empty';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { ExercisePage } from '$features/course/pages';
  import {
    questionnaire,
    questionnaireMetaData,
    clearQuestionnaireValidation,
    reset
  } from '$features/course/components/exercise/store';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import type { Question } from '$features/course/types';
  import {
    getQuestionTypeId,
    getQuestionTypeOptionById
  } from '$features/course/components/exercise/question-type-utils';
  import { normalizeQuestionOrder } from '$features/course/components/exercise/order-utils';

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
      const mapped = exercise.questions.map((question) => {
        const questionType = getQuestionTypeOptionById(getQuestionTypeId(question));
        return {
          ...question,
          questionTypeId: questionType.id,
          questionType
        };
      });
      questions = normalizeQuestionOrder(mapped);
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

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
  {#if isLockedForStudent}
    <Empty
      title={$t('course.navItem.lessons.content_locked_title')}
      description={$t('course.navItem.lessons.content_locked_description')}
      icon={LockIcon}
      variant="page"
      class="text-center"
    />
  {:else}
    <ExercisePage
      exerciseId={data.exerciseId}
      goBack={() => goto(resolve(path, {}))}
      isFetching={false}
      submissions={data.submissions ?? []}
      mySubmission={data.mySubmission ?? null}
    />
  {/if}
</Page.Root>
