<script lang="ts">
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Page from '@cio/ui/base/page';
  import { ExercisePage } from '$features/course/pages';
  import { questionnaireMetaData, reset } from '$features/course/components/exercise/store';
  import { courseApi } from '$features/course/api';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { hydrateExercisePageData } from '$features/course/utils/exercise-page-utils';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { ContentType } from '@cio/utils/constants/content';

  let { data = $bindable() } = $props();

  const path = `/courses/${data.courseId}/lessons`;
  const isCourseReady = $derived(courseApi.course?.id === data.courseId);

  const contentLockReason = $derived(
    getStudentContentLockReason(courseApi.course, data.exerciseId, ContentType.Exercise)
  );

  const isLockedForStudent = $derived.by(() => {
    if (!$isOrgStudent) return false;

    if (data.exercise?.isUnlocked === false) {
      return true;
    }

    if (!data.exercise || contentLockReason !== null) {
      return true;
    }

    return false;
  });

  $effect(() => {
    if (!data.exercise || isLockedForStudent) return;

    const meta = get(questionnaireMetaData);
    if (meta.isFinished && meta.exerciseId === data.exerciseId) {
      return;
    }
    if (meta.exerciseId != null && meta.exerciseId !== data.exerciseId) {
      reset();
    }

    hydrateExercisePageData(data.exercise, data.exerciseId);
  });
</script>

<Page.Root class="mx-auto flex w-full px-3 sm:w-[90%] sm:px-4 lg:max-w-5xl">
  {#if $isOrgStudent && !isCourseReady}
    <div class="flex justify-center py-16">
      <Spinner />
    </div>
  {:else}
    <ExercisePage
      exerciseId={data.exerciseId}
      goBack={() => goto(resolve(path, {}))}
      isFetching={false}
      submissions={data.submissions ?? []}
      mySubmissions={data.mySubmissions ?? []}
    />
  {/if}
</Page.Root>
