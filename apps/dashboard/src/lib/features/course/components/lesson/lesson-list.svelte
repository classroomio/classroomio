<script lang="ts">
  import { page } from '$app/state';
  import { dndzone } from 'svelte-dnd-action';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { Chip } from '@cio/ui/custom/chip';
  import { InputField } from '@cio/ui/custom/input-field';
  import { RoleBasedSecurity } from '$features/ui';
  import * as Empty from '@cio/ui/base/empty';
  import { lessonApi } from '$features/course/api';

  import { globalStore } from '$lib/utils/store/app';
  import { courseApi } from '$features/course/api';
  import { t } from '$lib/utils/functions/translations';
  import type { ListLessons } from '$features/course/utils/types';

  const flipDurationMs = 300;

  interface Props {
    reorder?: boolean;
    lessonEditing: string | undefined;
    lessonToDelete: ListLessons[number] | undefined;
    openDeleteModal?: boolean;
  }

  let {
    reorder = false,
    lessonEditing = $bindable(),
    lessonToDelete = $bindable(),
    openDeleteModal = $bindable(false)
  }: Props = $props();

  let errors: Record<string, string> = $state({});

  let courseId = $derived(courseApi.course?.id || '');

  async function saveLesson(lesson: ListLessons[number]) {
    await lessonApi.update(courseId, lesson.id, {
      title: lesson.title || '',
      lessonAt: lesson.lessonAt!,
      callUrl: lesson.callUrl!,
      teacherId: lesson.teacherId!,
      isUnlocked: lesson.isUnlocked!,
      sectionId: lesson.sectionId!
    });

    if (lessonApi.errors && Object.keys(lessonApi.errors).length) {
      // @ts-ignore
      errors = lessonApi.errors;
    } else {
      errors = {};
      lessonEditing = undefined;
    }
  }

  function handleDndConsider(e: any) {
    lessonApi.lessons = e.detail.items;
  }

  async function handleDndFinalize(e: any) {
    const prevLessonsByOrder = lessonApi.lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.order }), {});
    lessonApi.lessons = e.detail.items;

    // Only update the lesson order that changed
    for (const [index, item] of e.detail.items.entries()) {
      const order = index + 1;

      if (order !== prevLessonsByOrder[item.id]) {
        lessonApi.lessons[index].order = order;
        await lessonApi.update(courseId, item.id, { order });
      }
    }
  }

  function getLessonOrder(id: string): number | string {
    const index = lessonApi.lessons.findIndex((lesson) => lesson.id === id);

    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }
</script>

<section
  class="mx-auto w-full p-3 lg:w-11/12 lg:px-4"
  use:dndzone={{
    items: lessonApi.lessons,
    flipDurationMs,
    dragDisabled: !reorder,
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    }
  }}
  onconsider={handleDndConsider}
  onfinalize={handleDndFinalize}
>
  {#each lessonApi.lessons as lesson (lesson.id)}
    <div
      class="relative m-auto mb-4 flex max-w-xl items-center rounded-md border-2 border-gray-200 p-5 dark:bg-neutral-800"
    >
      <!-- Number Chip -->
      <div class="mr-5">
        <Chip value={getLessonOrder(lesson.id)} />
      </div>

      <!-- Lesson Content -->
      <div class="w-4/5">
        <!-- Lesson Title -->
        {#if lessonEditing === lesson.id}
          <InputField bind:value={lesson.title} autoFocus={true} className="max-w-lg" errorMessage={errors?.title} />
        {:else}
          <h3 class="m-0 flex items-center text-lg dark:text-white">
            <a
              href={$globalStore.isStudent && !lesson.isUnlocked
                ? page.url.pathname
                : `/courses/${courseApi.course?.id}/lessons/${lesson.id}`}
              class="font-medium text-black no-underline hover:underline dark:text-white {$globalStore.isStudent &&
              !lesson.isUnlocked
                ? 'cursor-not-allowed'
                : ''}"
            >
              {lesson.title}
            </a>
          </h3>
        {/if}

        <div class="mt-2 flex w-4/5 flex-col items-start justify-between lg:flex-row lg:items-center">
          <!-- Lesson Length -->
          <div class="mb-3 flex items-center lg:mb-0">
            <ListChecksIcon size={16} />
            <p class="ml-2 text-sm text-gray-500 dark:text-white">
              <!-- TODO: REMOVE THIS AFTER MOVING EXERCISES TO SIDEBAR -->
              0
              {$t('exercises.heading')}
            </p>
          </div>
        </div>
      </div>

      <!-- 3 dot edit -->
      <div class="flex flex-row">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <EllipsisVerticalIcon class="h-5 w-5" />
                <span class="sr-only">Open menu</span>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                onclick={async () => {
                  lesson.isUnlocked = !lesson.isUnlocked;

                  await lessonApi.update(courseId, lesson.id, {
                    title: lesson.title || '',
                    lessonAt: lesson.lessonAt!,
                    callUrl: lesson.callUrl!,
                    teacherId: lesson.teacherId!,
                    isUnlocked: lesson.isUnlocked!,
                    sectionId: lesson.sectionId!
                  });
                }}
              >
                {lesson.isUnlocked
                  ? $t('course.navItem.lessons.add_lesson.lock')
                  : $t('course.navItem.lessons.add_lesson.unlock')}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onclick={() => {
                  if (lessonEditing === lesson.id) {
                    saveLesson(lesson);
                  } else {
                    lessonEditing = lesson.id;
                  }
                }}
              >
                {lessonEditing === lesson.id
                  ? $t('course.navItem.lessons.add_lesson.save')
                  : $t('course.navItem.lessons.add_lesson.edit')}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="text-red-600 focus:text-red-600 dark:text-red-400"
                onclick={() => {
                  lessonToDelete = lesson;
                  openDeleteModal = true;
                }}
              >
                {$t('course.navItem.lessons.add_lesson.delete')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </RoleBasedSecurity>
      </div>
    </div>
  {:else}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="size-6" />
        </Empty.Media>
        <Empty.Title>{$t('course.navItem.lessons.body_header')}</Empty.Title>
        <Empty.Description>
          {$t('course.navItem.lessons.body_content')}
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {/each}
</section>
