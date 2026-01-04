<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { CourseSidebar } from '$features/course/components/sidebar';
  import { CourseHeader } from '$features/course/components';
  import type { Course } from '$features/course/types';
  import * as Page from '@cio/ui/base/page';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Confetti } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { GroupMember } from '$features/course/utils/types';

  interface Props {
    children?: import('svelte').Snippet;
    path: string;
    data: {
      course?: Course;
      courseId: string;
      exerciseId?: string;
      isMaterialsTabActive?: boolean;
    };
  }

  let { children, path, data }: Props = $props();

  // Initialize course from server data
  $effect(() => {
    console.log('data', data);
    if (!data.course) return;

    courseApi.setCourse(data.course);
  });

  const user: GroupMember | undefined = $derived(
    courseApi.group.people.find((person) => person.profileId === $profile.id)
  );
  const canCheck = $derived($profile.id && courseApi.group.id);

  const isPermitted = $derived.by(() => {
    if (!canCheck) return true;

    if ($isOrgAdmin === null) return true;

    return $isOrgAdmin || user;
  });

  // Determine if this is an exercise page from current page data
  const isExercisePage = $derived(data.isMaterialsTabActive === false && !!data.exerciseId);
</script>

<svelte:head>
  <title>{courseApi.course?.title || 'ClassroomIO Course'}</title>
</svelte:head>

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

<Sidebar.Provider>
  <CourseSidebar {path} id={data.courseId} />

  <Sidebar.Inset
    class="w-[calc(100vw-var(--sidebar-width))] overflow-x-hidden group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
  >
    <CourseHeader />

    {#if isExercisePage}
      <Confetti />
    {/if}

    {#if isPermitted}
      <Page.Root class="mx-auto flex px-4 lg:max-w-6xl">
        {@render children?.()}
      </Page.Root>
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>
