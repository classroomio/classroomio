<script lang="ts">
  import { page } from '$app/state';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import CertificateEditor from '$features/course/components/ceritficate/editor/certificate-editor.svelte';

  const courseId = $derived(page.params.id ?? '');
  let refreshedCourseId = $state('');
  let isRefreshing = $state(true);

  $effect(() => {
    const profileId = $profile.id;
    if (!courseId || !profileId || refreshedCourseId === courseId) return;

    const requestedCourseId = courseId;
    refreshedCourseId = requestedCourseId;
    isRefreshing = true;
    void courseApi.refreshCourse(requestedCourseId, profileId).finally(() => {
      if (refreshedCourseId === requestedCourseId) {
        isRefreshing = false;
      }
    });
  });

  const isReady = $derived(!isRefreshing && courseApi.course?.id === courseId);
</script>

<svelte:head>
  <title>{courseApi.course?.title ?? $t('course.navItem.certificates.editor.title')}</title>
</svelte:head>

<div class="ui:bg-background min-h-screen w-full">
  {#if isReady}
    {#key courseId}
      <CertificateEditor {courseId} />
    {/key}
  {:else}
    <div class="flex min-h-[60vh] items-center justify-center">
      <Spinner class="size-8!" />
    </div>
  {/if}
</div>
