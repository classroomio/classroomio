<script lang="ts">
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Page from '@cio/ui/base/page';
  import { ExercisePage } from '$features/course/pages';
  import { questionnaire, questionnaireMetaData, reset } from '$features/course/components/exercise/store';
  import { courseApi } from '$features/course/api';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';
  import { exerciseRemoteUpdateNotice, hydrateExercisePageData } from '$features/course/utils/exercise-page-utils';
  import { hasQuestionnaireChanges } from '$features/course/utils/exercise-state-merge';
  import { applyExerciseDraft, clearExerciseDraft, peekExerciseDraft } from '$features/course/utils/exercise-draft';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
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

  let draftCheckedKey = '';

  $effect(() => {
    const currentExerciseId = data.exerciseId;
    if (!currentExerciseId || !data.exercise || isLockedForStudent) return;

    const meta = get(questionnaireMetaData);
    if (meta.exerciseId === currentExerciseId) return;

    if (meta.exerciseId != null) {
      reset();
    }

    hydrateExercisePageData(data.exercise, currentExerciseId);
  });

  $effect(() => {
    const currentExerciseId = data.exerciseId;
    const profileId = $profile.id;
    if (!currentExerciseId || !profileId || !data.exercise || isLockedForStudent) return;
    if ($questionnaireMetaData.exerciseId !== currentExerciseId) return;

    const draftKey = `${profileId}:${data.courseId}:${currentExerciseId}`;
    if (draftCheckedKey === draftKey) return;

    draftCheckedKey = draftKey;

    const pendingDraft = peekExerciseDraft(data.courseId, currentExerciseId, profileId);
    if (!pendingDraft) return;

    if (!hasQuestionnaireChanges(pendingDraft.questionnaire, get(questionnaire))) {
      clearExerciseDraft(data.courseId, currentExerciseId, profileId);
      return;
    }

    const shouldRestore = window.confirm(t.get('course.navItem.lessons.exercises.all_exercises.draft_recovery'));

    if (!shouldRestore) {
      clearExerciseDraft(data.courseId, currentExerciseId, profileId);
      return;
    }

    const restoredDraft = applyExerciseDraft(data.courseId, currentExerciseId, profileId);
    if (!restoredDraft) return;

    if (restoredDraft.conflictCount > 0) {
      exerciseRemoteUpdateNotice.set({
        baseState: restoredDraft.baseState,
        conflictCount: restoredDraft.conflictCount,
        exerciseId: currentExerciseId,
        remoteState: restoredDraft.remoteState,
        source: 'draft',
        type: 'conflict'
      });
    }
    snackbar.success('snackbar.exercise.draft_restored');
  });
</script>

<Page.Root class="mx-auto flex w-full gap-0! pb-0!">
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
      canGradeSubmissions={data.canGradeSubmissions ?? false}
    />
  {/if}
</Page.Root>
