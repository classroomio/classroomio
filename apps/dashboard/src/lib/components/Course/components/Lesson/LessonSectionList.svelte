<script lang="ts">
  import { page } from '$app/state';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Chip } from '@cio/ui/custom/chip';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { course } from '$lib/components/Course/store';
  import { handleAddLessonWidget } from '$lib/components/Course/components/Lesson/store';
  import { snackbar } from '$features/ui/snackbar/store';
  import {
    lessonSections,
    handleDelete,
    handleSaveLesson,
    handleSaveLessonSection,
    handleDeleteSection
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { updateLesson, updateLessonSection } from '$lib/utils/services/courses';
  import type { Lesson } from '$lib/utils/types';
  import DeleteLessonConfirmation from '$lib/components/Course/components/Lesson/DeleteLessonConfirmation.svelte';
  import { RoleBasedSecurity } from '$features/ui';

  type CrudParam = {
    sectionId?: string;
    lessonId?: string;
    sectionTitle?: string;
    lessonTitle?: string;
  };

  interface Props {
    reorder?: boolean;
    lessonEditing: string | undefined;
  }

  let { reorder = false, lessonEditing = $bindable() }: Props = $props();

  let prevTitle: string | undefined = $state();
  let errors: Record<string, string> = $state({});
  let openDeleteModal = $state(false);
  let deletingData = {
    id: '',
    isSection: false
  };

  function onEdit(params: CrudParam) {
    lessonEditing = params.sectionId || params.lessonId;
    prevTitle = params.sectionTitle || params.lessonTitle;
  }

  async function onSave(params: CrudParam, lesson?: Lesson) {
    if (params.sectionId) {
      const section = $lessonSections.find((s) => s.id === params.sectionId);
      if (!section) return;

      const validationRes = await handleSaveLessonSection(section, section.course_id);

      if (validationRes && Object.keys(validationRes).length) {
        errors = {
          // @ts-ignore
          title: validationRes?.title
        };
      }
    } else if (lesson) {
      const validationRes = await handleSaveLesson(lesson, lesson.course_id);

      if (validationRes && Object.keys(validationRes).length) {
        errors = {
          // @ts-ignore
          title: validationRes?.title
        };
      }
    }

    if (!errors?.title) {
      resetEdit();

      snackbar.success('snackbar.success_update');
    }
  }

  function onDelete(params: CrudParam) {
    deletingData.id = params.sectionId || params.lessonId || '';
    deletingData.isSection = params.sectionId ? true : false;
    openDeleteModal = true;
  }

  function deleteLesson() {
    if (deletingData.isSection) {
      handleDeleteSection(deletingData.id);
    } else {
      handleDelete(deletingData.id);
    }
  }

  function resetEdit() {
    lessonEditing = undefined;
    prevTitle = undefined;
    errors = {};
  }

  function handleAddLesson(id) {
    handleAddLessonWidget.update(() => ({
      open: true,
      isSection: false,
      id
    }));
  }

  /**
   * Drag functionality
   */
  const flipDurationMs = 200;

  function handleDndConsiderColumns(e) {
    $lessonSections = e.detail.items;
  }
  function handleDndFinalizeColumns(e) {
    const prevSectionsOrder = $lessonSections.reduce((acc, l) => ({ ...acc, [l.id]: l.order }), {});

    $lessonSections = e.detail.items;

    e.detail.items.forEach((section, index) => {
      const order = index + 1;

      if (order !== prevSectionsOrder[section.id]) {
        $lessonSections[index].order = order;
        updateLessonSection({ order }, section.id).then((update) => console.log(`updated section order`, update));
      }
    });
  }
  function handleDndConsiderCards(cid, e) {
    const colIdx = $lessonSections.findIndex((c) => c.id === cid);
    $lessonSections[colIdx].lessons = e.detail.items;
    $lessonSections = [...$lessonSections];
  }
  function handleDndFinalizeCards(cid, e) {
    const colIdx = $lessonSections.findIndex((c) => c.id === cid);

    const section = $lessonSections[colIdx];
    const prevLessonOrder = section.lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.order }), {});

    $lessonSections[colIdx].lessons = e.detail.items;
    $lessonSections = [...$lessonSections];

    e.detail.items.forEach((lesson: Lesson, index: number) => {
      const order = index + 1;

      if (order !== prevLessonOrder[lesson.id] || lesson.section_id !== section.id) {
        section.lessons[index].order = order;

        const lessonUpdate = {
          order,
          section_id: $lessonSections[colIdx].id
        };
        updateLesson(lessonUpdate, lesson.id).then((update) => console.log(`updated lesson order`, update));
      }
    });
  }

  function getLessonOrder(lessons, id) {
    const index = lessons.findIndex((lesson) => lesson.id === id);

    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }
</script>

<DeleteLessonConfirmation bind:openDeleteModal {deleteLesson} />

<section
  class="mx-auto w-full p-3 lg:w-11/12 lg:px-4"
  use:dndzone={{
    items: $lessonSections,
    flipDurationMs,
    type: 'rows',
    dropTargetStyle: {
      border: '2px #1d4ed8 solid',
      'border-style': 'dashed'
    },
    dragDisabled: !reorder
  }}
  onconsider={handleDndConsiderColumns}
  onfinalize={handleDndFinalizeColumns}
>
  {#each $lessonSections as section (section.id)}
    <div class="m-auto mb-3 max-w-xl rounded-md border-2 border-gray-200 dark:border-neutral-600 dark:bg-neutral-800">
      <div
        class="mb-2 flex min-h-[50px] items-center justify-between rounded-tl-md rounded-tr-md border-b bg-gray-50 px-3 py-1 dark:bg-neutral-700"
      >
        {#if lessonEditing === section.id}
          <InputField className="w-4/6" bind:value={section.title} errorMessage={errors?.title} />
        {:else}
          <p class="w-4/6 font-semibold">{section.title}</p>
        {/if}

        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <div class="flex items-center">
            {#if lessonEditing === section.id}
              <Button
                variant="outline"
                onclick={() => {
                  section.title = prevTitle ?? section.title;
                  resetEdit();
                }}
              >
                {$t('course.navItem.lessons.add_lesson.cancel')}
              </Button>
              <Button onclick={() => onSave({ sectionId: section.id })}>
                {$t('course.navItem.lessons.add_lesson.save')}
              </Button>
            {:else}
              <IconButton onclick={() => handleAddLesson(section.id)} disabled={!!lessonEditing}>
                <PlusIcon size={16} />
              </IconButton>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <EllipsisVerticalIcon class="h-5 w-5" />
                    <span class="sr-only">Open menu</span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item
                    disabled={!!lessonEditing}
                    onclick={() => onEdit({ sectionId: section.id, sectionTitle: section.title })}
                  >
                    {$t('course.navItem.lessons.add_lesson.edit')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    class="text-red-600 focus:text-red-600 dark:text-red-400"
                    onclick={() => onDelete({ sectionId: section.id })}
                  >
                    {$t('course.navItem.lessons.add_lesson.delete')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </div>
        </RoleBasedSecurity>
      </div>

      <div
        class="mx-3 py-1"
        use:dndzone={{
          items: section.lessons,
          flipDurationMs,
          dropTargetStyle: {
            border: '2px #1d4ed8 solid',
            'border-style': 'dashed'
          },
          dragDisabled: !reorder
        }}
        onconsider={(e) => handleDndConsiderCards(section.id, e)}
        onfinalize={(e) => handleDndFinalizeCards(section.id, e)}
      >
        {#each section.lessons as lesson (lesson.id)}
          <div
            class="mb-2 flex min-h-[50px] max-w-xl items-center justify-between rounded-md border border-gray-200 px-3 py-1"
            animate:flip={{ duration: flipDurationMs }}
          >
            {#if lessonEditing === lesson.id}
              <InputField className="w-4/6" bind:value={lesson.title} errorMessage={errors?.title} />
            {:else}
              <div class="flex w-4/5 items-center gap-2">
                <Chip value={getLessonOrder(section.lessons, lesson.id)} />
                <div>
                  <a
                    href={$globalStore.isStudent && !lesson.is_unlocked
                      ? page.url.pathname
                      : `/courses/${$course.id}/lessons/${lesson.id}`}
                    class=" text-black dark:text-white {$globalStore.isStudent && !lesson.is_unlocked
                      ? 'cursor-not-allowed'
                      : ''}"
                    data-sveltekit-preload-data="off"
                  >
                    {lesson.title}
                  </a>

                  <div class="mb-3 mt-1 flex items-center lg:mb-0">
                    <ListChecksIcon size={16} />
                    <p class="ml-2 text-xs text-gray-500 dark:text-white">
                      {lesson?.totalExercises ? lesson?.totalExercises?.map((c) => c.count) : 0}
                      {$t('exercises.heading')}
                    </p>
                  </div>
                </div>
              </div>
            {/if}

            <RoleBasedSecurity allowedRoles={[1, 2]}>
              <div class="flex items-center gap-1">
                <!-- IS EDITING -->
                {#if lessonEditing === lesson.id}
                  <Button
                    variant="outline"
                    onclick={() => {
                      lesson.title = prevTitle ?? lesson.title;
                      resetEdit();
                    }}
                  >
                    {$t('course.navItem.lessons.add_lesson.cancel')}
                  </Button>
                  <Button onclick={() => onSave({ lessonId: lesson.id }, lesson)}>
                    {$t('course.navItem.lessons.add_lesson.save')}
                  </Button>
                {:else}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <EllipsisVerticalIcon class="h-5 w-5" />
                        <span class="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item
                        onclick={() => {
                          lesson.is_unlocked = !lesson.is_unlocked;
                          handleSaveLesson(lesson, $course.id);
                        }}
                      >
                        {lesson.is_unlocked
                          ? $t('course.navItem.lessons.add_lesson.lock')
                          : $t('course.navItem.lessons.add_lesson.unlock')}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onclick={() => onEdit({ lessonId: lesson.id, lessonTitle: lesson.title })}>
                        {$t('course.navItem.lessons.add_lesson.edit')}
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        class="text-red-600 focus:text-red-600 dark:text-red-400"
                        onclick={() => onDelete({ lessonId: lesson.id })}
                      >
                        {$t('course.navItem.lessons.add_lesson.delete')}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                {/if}
              </div>
            </RoleBasedSecurity>
          </div>
        {:else}
          {$t('course.navItem.lessons.no_lesson')}
        {/each}
      </div>
    </div>
  {/each}
</section>
