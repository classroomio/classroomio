<script lang="ts">
  import { page } from '$app/state';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import CertificateEditor from '$features/course/components/ceritficate/editor/certificate-editor.svelte';

  const courseId = $derived(page.params.id ?? '');

  $effect(() => {
    if (!courseId || !$profile.id) return;
    courseApi.ensureCourse(courseId, $profile.id);
  });

  const isReady = $derived(courseApi.course?.id === courseId);
</script>

<svelte:head>
  <title>{courseApi.course?.title ?? $t('course.navItem.certificates.editor.title')}</title>
</svelte:head>

<div class="ui:bg-background min-h-screen w-full">
  {#if isReady}
    <CertificateEditor {courseId} />
  {:else}
    <div class="flex min-h-[60vh] items-center justify-center">
      <Spinner class="size-8!" />
    </div>
  {/if}
</div>
