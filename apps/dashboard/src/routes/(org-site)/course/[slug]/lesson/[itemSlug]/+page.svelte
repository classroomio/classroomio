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
  import { classroomio } from '$lib/utils/services/api';

  /** Build a fully-qualified HLS URL from the relative `/hls/{assetId}/...` shape. */
  function resolveHlsUrl(rawUrl: string): string {
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    const match = rawUrl.match(/^\/?hls\/([^/]+)\/(.+)$/);
    if (!match) return rawUrl;

    const [, assetId, rest] = match;
    const built = classroomio.hls[':assetId']['*'].$url({ param: { assetId } });
    return built.toString().replace(/\/\*$/, '') + '/' + rest;
  }

  /**
   * Mint the public HLS cookie via the org-site endpoint. The server
   * derives the actual asset id from the public course tree, so an
   * anonymous learner can't request a cookie for any asset they don't
   * already have access to via this lesson URL.
   */
  async function mintPublicHlsCookie(courseSlug: string, itemSlug: string): Promise<void> {
    await classroomio['org-site'].course[':courseSlug'].item[':itemSlug']['hls-cookie'].$post({
      param: { courseSlug, itemSlug }
    });
  }

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
      {resolveHlsUrl}
      onBeforeHlsLoad={lessonView.video?.hls ? () => mintPublicHlsCookie(data.tree.course.slug, itemSlug) : undefined}
      playbackErrorLabel={$t('course.navItem.lessons.materials.tabs.video.playback_error')}
      playbackReloadLabel={$t('course.navItem.lessons.materials.tabs.video.playback_reload')}
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
