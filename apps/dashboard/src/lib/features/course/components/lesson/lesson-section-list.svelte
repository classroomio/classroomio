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
  import { courseApi } from '$features/course/api';
  import { handleAddLessonWidget } from '$features/course/components/lesson/store';
  import { snackbar } from '$features/ui/snackbar/store';
  import { lessonApi } from '$features/course/api';
  import DeleteLessonConfirmation from '$features/course/components/lesson/delete-lesson-confirmation.svelte';
  import { RoleBasedSecurity } from '$features/ui';
  import type { ListLessons } from '$features/course/utils/types';

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
  const courseId = $derived(courseApi.course?.id || '');

  function onEdit(params: CrudParam) {
    lessonEditing = params.sectionId || params.lessonId;
    prevTitle = params.sectionTitle || params.lessonTitle;
  }

  async function onSave(params: CrudParam, lesson?: ListLessons[number]) {
    if (params.sectionId) {
      const section = lessonApi.sections.find((s) => s.id === params.sectionId);
      if (!section) return;

      await lessonApi.updateSection(courseId, section.id, {
        title: section.title!
      });

      if (lessonApi.errors && Object.keys(lessonApi.errors).length) {
        errors = {
          // @ts-ignore
          title: lessonApi.errors.title
        };
      }
    } else if (lesson) {
      await lessonApi.update(courseId, lesson.id, {
        title: lesson.title || '',
        lessonAt: lesson.lessonAt!,
        callUrl: lesson.callUrl || '',
        teacherId: lesson.teacherId!,
        isUnlocked: lesson.isUnlocked!,
        sectionId: lesson.sectionId!
      });

      if (lessonApi.errors && Object.keys(lessonApi.errors).length) {
        errors = {
          title: lessonApi.errors.title
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

  async function deleteLesson() {
    if (deletingData.isSection) {
      await lessonApi.deleteSection(courseId, deletingData.id);
    } else {
      await lessonApi.delete(courseId, deletingData.id);
      if (lessonApi.success) {
        lessonApi.lessons = lessonApi.lessons.filter((lesson) => lesson.id !== deletingData.id);
        lessonApi.sections = lessonApi.sections.map((section) => {
          section.lessons = section.lessons.filter((lesson) => lesson.id !== deletingData.id);
          return section;
        });
      }
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
    lessonApi.sections = e.detail.items;
  }
  async function handleDndFinalizeColumns(e) {
    const prevSections = lessonApi.sections.map((s) => ({ id: s.id, order: s.order }));

    lessonApi.sections = e.detail.items;

    const newSections = e.detail.items.map((s) => ({ id: s.id, order: s.order }));
    const sectionsToReorder = newSections.filter((s) => s.order !== prevSections.find((p) => p.id === s.id)?.order);

    await lessonApi.reorderSections(courseId, sectionsToReorder);
  }

  function handleDndConsiderCards(cid, e) {
    const colIdx = lessonApi.sections.findIndex((c) => c.id === cid);
    lessonApi.sections[colIdx].lessons = e.detail.items;
    lessonApi.sections = [...lessonApi.sections];
  }
  async function handleDndFinalizeCards(cid, e) {
    const colIdx = lessonApi.sections.findIndex((c) => c.id === cid);

    const section = lessonApi.sections[colIdx];
    const prevLessonOrder = section.lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.order }), {});
    const prevSectionIds = section.lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.sectionId }), {});

    lessonApi.sections[colIdx].lessons = e.detail.items;
    lessonApi.sections = [...lessonApi.sections];

    // Collect all lessons that need to be updated
    const lessonsToReorder: Array<{ id: string; order: number; sectionId?: string }> = [];

    e.detail.items.forEach((lesson: ListLessons[number], index: number) => {
      const order = index + 1;
      const newSectionId = lessonApi.sections[colIdx].id;

      // Check if order or sectionId changed
      if (order !== prevLessonOrder[lesson.id] || prevSectionIds[lesson.id] !== newSectionId) {
        section.lessons[index].order = order;
        lessonsToReorder.push({
          id: lesson.id,
          order,
          sectionId: newSectionId
        });
      }
    });

    // Make a single API call to reorder all lessons
    if (lessonsToReorder.length > 0) {
      await lessonApi.reorderLessons(courseId, lessonsToReorder);
    }
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
    items: lessonApi.sections,
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
  {#each lessonApi.sections as section (section.id)}
    <div class="m-auto mb-3 max-w-xl rounded-md border-2 border-gray-200 dark:bg-neutral-800">
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
                    onclick={() => onEdit({ sectionId: section.id, sectionTitle: section.title! })}
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
                    href={$globalStore.isStudent && !lesson.isUnlocked
                      ? page.url.pathname
                      : `/courses/${courseApi.course?.id}/lessons/${lesson.id}`}
                    class=" text-black dark:text-white {$globalStore.isStudent && !lesson.isUnlocked
                      ? 'cursor-not-allowed'
                      : ''}"
                    data-sveltekit-preload-data="off"
                  >
                    {lesson.title}
                  </a>

                  <div class="mt-1 mb-3 flex items-center lg:mb-0">
                    <ListChecksIcon size={16} />
                    <p class="ml-2 text-xs text-gray-500 dark:text-white">
                      <!-- TODO REMOVE THIS -->
                      0
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
                        onclick={async () => {
                          lesson.isUnlocked = !lesson.isUnlocked;

                          const courseId = courseApi.course?.id || '';
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
