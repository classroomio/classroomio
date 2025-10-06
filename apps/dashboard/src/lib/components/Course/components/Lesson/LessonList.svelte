<script lang="ts">
  import { page } from '$app/state';
  import { dndzone } from 'svelte-dnd-action';
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import { course } from '$lib/components/Course/store';
  import { globalStore } from '$lib/utils/store/app';
  import ScreenMap from 'carbon-icons-svelte/lib/ScreenMap.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import {
    lessons,
    handleSaveLesson
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { updateLesson } from '$lib/utils/services/courses';
  import type { Course, Lesson } from '$lib/utils/types';
  import Box from '$lib/components/Box/index.svelte';

  const flipDurationMs = 300;

  interface Props {
    reorder?: boolean;
    lessonEditing: string | undefined;
    lessonToDelete: Lesson | undefined;
    openDeleteModal?: boolean;
  }

  let {
    reorder = false,
    lessonEditing = $bindable(),
    lessonToDelete = $bindable(),
    openDeleteModal = $bindable(false)
  }: Props = $props();

  let errors: Record<string, string> = $state({});

  async function saveLesson(lesson: Lesson, courseId: Course['id']) {
    const validationRes = await handleSaveLesson(lesson, courseId);

    if (validationRes && Object.keys(validationRes).length) {
      // @ts-ignore
      errors = validationRes;
    } else {
      errors = {};
      lessonEditing = undefined;
    }
  }

  function handleDndConsider(e: any) {
    $lessons = e.detail.items;
  }

  function handleDndFinalize(e: any) {
    const prevLessonsByOrder = $lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.order }), {});
    $lessons = e.detail.items;

    // Only update the lesson order that changed
    e.detail.items.forEach((item: { id: string }, index: number) => {
      const order = index + 1;

      if (order !== prevLessonsByOrder[item.id]) {
        $lessons[index].order = order;
        updateLesson({ order }, item.id).then((update) =>
          console.log(`updated lesson order`, update)
        );
      }
    });
  }

  function getLessonOrder(id: string) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);

    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }
</script>

<section
  class="m-auto w-full p-3 lg:w-11/12 lg:px-4"
  use:dndzone={{
    items: $lessons,
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
  {#each $lessons as lesson (lesson.id)}
    <div
      class="relative m-auto mb-4 flex max-w-xl items-center rounded-md border-2 border-gray-200 p-5 dark:border-neutral-600 dark:bg-neutral-800"
    >
      <!-- Number Chip -->
      <div class="mr-5">
        <TextChip
          value={getLessonOrder(lesson.id)}
          size="sm"
          shape="rounded-full"
          className="bg-primary-200 text-primary-600 text-xs"
        />
      </div>

      <!-- Lesson Content -->
      <div class="w-4/5">
        <!-- Lesson Title -->
        {#if lessonEditing === lesson.id}
          <TextField
            bind:value={lesson.title}
            autoFocus={true}
            className="max-w-lg"
            errorMessage={errors?.title}
          />
        {:else}
          <h3 class="m-0 flex items-center text-lg dark:text-white">
            <a
              href={$globalStore.isStudent && !lesson.is_unlocked
                ? page.url.pathname
                : `/courses/${$course.id}/lessons/${lesson.id}`}
              class="font-medium text-black no-underline hover:underline dark:text-white {$globalStore.isStudent &&
              !lesson.is_unlocked
                ? 'cursor-not-allowed'
                : ''}"
            >
              {lesson.title}
            </a>
          </h3>
        {/if}

        <div
          class="mt-2 flex w-4/5 flex-col items-start justify-between lg:flex-row lg:items-center"
        >
          <!-- Lesson Length -->
          <div class="mb-3 flex items-center lg:mb-0">
            <ScreenMap size={20} class="carbon-icon dark:text-white" />
            <p class="ml-2 text-sm text-gray-500 dark:text-white">
              {lesson?.totalExercises ? lesson?.totalExercises?.map((c) => c.count) : 0}
              {$t('exercises.heading')}
            </p>
          </div>
        </div>
      </div>

      <!-- 3 dot edit -->
      <div class="flex flex-row">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <OverflowMenu size="xl">
            <OverflowMenuItem
              text={lesson.is_unlocked
                ? $t('course.navItem.lessons.add_lesson.lock')
                : $t('course.navItem.lessons.add_lesson.unlock')}
              on:click={() => {
                lesson.is_unlocked = !lesson.is_unlocked;
                handleSaveLesson(lesson, $course.id);
              }}
            />
            <OverflowMenuItem
              text={lessonEditing === lesson.id
                ? $t('course.navItem.lessons.add_lesson.save')
                : $t('course.navItem.lessons.add_lesson.edit')}
              on:click={() => {
                if (lessonEditing === lesson.id) {
                  saveLesson(lesson, $course.id);
                } else {
                  lessonEditing = lesson.id;
                }
              }}
            />
            <OverflowMenuItem
              danger
              text={$t('course.navItem.lessons.add_lesson.delete')}
              on:click={() => {
                lessonToDelete = lesson;
                openDeleteModal = true;
              }}
            />
          </OverflowMenu>
        </RoleBasedSecurity>
      </div>
    </div>
  {:else}
    <Box>
      <div class="flex justify-between flex-col items-center w-[90%] md:w-96">
        <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="my-2.5 mx-auto" />
        <h2 class="text-xl my-1.5 font-normal">{$t('course.navItem.lessons.body_header')}</h2>
        <p class="text-sm text-center text-slate-500">
          {$t('course.navItem.lessons.body_content')}
        </p>
      </div>
    </Box>
  {/each}
</section>
