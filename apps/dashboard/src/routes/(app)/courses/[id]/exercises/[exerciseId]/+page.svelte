<script lang="ts">
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Empty } from '@cio/ui/custom/empty';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { ExercisePage } from '$features/course/pages';
  import { questionnaireMetaData, reset } from '$features/course/components/exercise/store';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { hydrateExercisePageData } from '$features/course/utils/exercise-page-utils';

  let { data = $bindable() } = $props();

  const path = `/courses/${data.courseId}/lessons`;
  const isLockedForStudent = $derived($isOrgStudent && data.exercise?.isUnlocked === false);

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
      mySubmissions={data.mySubmissions ?? []}
    />
  {/if}
</Page.Root>
