<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Empty } from '@cio/ui/custom/empty';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { CourseSidebar } from '$features/course/components/sidebar';
  import { CourseHeader } from '$features/course/components';
  import type { Course } from '$features/course/types';
  import * as Page from '@cio/ui/base/page';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Confetti } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import ContentCreateModal from '$features/course/components/content/content-create-modal.svelte';
  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseMember } from '$features/course/utils/types';

  interface Props {
    children?: import('svelte').Snippet;
    path: string;
    data: {
      course?: Course;
      courseId: string;
      exerciseId?: string;
    };
  }

  let { children, path, data }: Props = $props();

  // Initialize course store on the client (fetch once, then reuse store data).
  $effect(() => {
    if (!data.courseId || !$profile.id) return;

    if (data.course) {
      courseApi.setCourse(data.course, $profile.id);
      return;
    }

    courseApi.ensureCourse(data.courseId, $profile.id);
  });

  const isCourseReady = $derived.by(() => {
    return courseApi.course?.id === data.courseId && !!courseApi.group.id;
  });

  const user: CourseMember | undefined = $derived(
    courseApi.group.people.find((person) => person.profileId === $profile.id)
  );
  const canCheck = $derived(!!$profile.id && isCourseReady);

  const isPermitted = $derived.by(() => {
    if (!isCourseReady) return false;
    if (!canCheck) return true;

    if ($isOrgAdmin === null) return true;

    return $isOrgAdmin || user;
  });

  const isExercisePage = $derived(!!data.exerciseId);
</script>

<svelte:head>
  <title>{courseApi.course?.title || 'ClassroomIO Course'}</title>
</svelte:head>

{#if isCourseReady}
  <Dialog.Root open={!isPermitted}>
    <Dialog.Content class="w-96">
      <Dialog.Header>
        <Dialog.Title>{$t('course.not_permitted.header')}</Dialog.Title>
      </Dialog.Header>
      <div>
        <p class="text-md text-center dark:text-white">
          {$t('course.not_permitted.body')}
        </p>

        <div class="mt-5 flex justify-center">
          <Button
            onclick={() => {
              goto('/org/*');
            }}
          >
            {$t('course.not_permitted.button')}
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}

<Sidebar.Provider data-sveltekit-preload-data="off">
  <CourseSidebar {path} id={data.courseId} />

  <Sidebar.Inset
    class="w-[calc(100vw-var(--sidebar-width))] group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
  >
    <CourseHeader />
    <ContentCreateModal />

    {#if !isCourseReady}
      <div class="mx-auto flex h-[calc(100vh-56px)] w-full items-center justify-center">
        <Empty
          title="Loading course…"
          description="Please wait while we load your course data."
          icon={LoaderCircleIcon}
          iconClass="animate-spin"
          variant="page"
        />
      </div>
    {:else}
      {#if isExercisePage}
        <Confetti />
      {/if}

      <Page.Root class="mx-auto flex max-w-3xl px-4">
        {@render children?.()}
      </Page.Root>
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>
