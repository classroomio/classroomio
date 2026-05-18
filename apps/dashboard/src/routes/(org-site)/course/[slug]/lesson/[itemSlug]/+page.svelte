<script lang="ts">
  import { page } from '$app/state';
  import { PublicCourse } from '@cio/ui';
  import { toPublicExerciseView, toPublicLessonView } from '$features/course/utils/public-course-mappers';
  import {
    publicExerciseAttemptsStorageKey,
    type PublicLessonViewData,
    type PublicExerciseViewData
  } from '@cio/ui/custom/public-course';
  import { getExerciseQuestionLabels } from '$features/course/components/exercise/question-labels';
  import { t } from '$lib/utils/functions/translations';

  const exerciseLabels = $derived(getExerciseQuestionLabels());

  let { data } = $props();

  const callout = $derived(data?.tree?.course.callout ?? null);
  const itemSlug = $derived(data.item.slug);

  const lessonView = $derived<PublicLessonViewData | null>(
    data.item.kind === 'lesson' ? toPublicLessonView(data.item) : null
  );
  const exerciseView = $derived<PublicExerciseViewData | null>(
    data.item.kind === 'exercise' ? toPublicExerciseView(data.item) : null
  );

  const breadcrumbJsonLd = $derived.by(() => {
    const courseUrl = new URL(`/course/${data?.tree.course.slug}`, page.url.origin).href;
    const itemTitle = 'title' in data.item ? data.item.title : data?.tree.course.title;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: data?.tree.course.title,
          item: courseUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: itemTitle,
          item: page.url.href
        }
      ]
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c');
  });
</script>

<svelte:head>
  {#if breadcrumbJsonLd}
    {@html `<script type="application/ld+json">${breadcrumbJsonLd}</script>`}
  {/if}
</svelte:head>

{#key data.item.id}
  {#if lessonView}
    <PublicCourse.PublicLessonView
      lesson={lessonView}
      videoCaptionsLabel={$t('course.navItem.lessons.materials.tabs.video.transcript.captions_label')}
      {callout}
    />
  {:else if exerciseView}
    <PublicCourse.PublicExerciseView
      exercise={exerciseView}
      {callout}
      labels={exerciseLabels}
      attemptsPersistenceKey={publicExerciseAttemptsStorageKey(data.tree.course.slug, itemSlug)}
      formatAttemptOption={({ attemptNumber, correct, total }) =>
        t.get('public_course.exercise.attempt_option', { attemptNumber, correct, total })}
      newAttemptOptionLabel={$t('public_course.exercise.practice_again')}
      attemptsSelectAriaLabel={$t('public_course.exercise.attempts_select_aria')}
      submitLabel={$t('public_course.exercise.submit')}
      tryAgainLabel={$t('public_course.exercise.try_again')}
      privacyHint={$t('public_course.exercise.privacy_hint')}
      summaryTemplate={$t('public_course.exercise.summary_template')}
    />
  {/if}
{/key}
