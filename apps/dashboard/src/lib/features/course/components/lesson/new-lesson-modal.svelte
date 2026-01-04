<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { courseApi, lessonApi } from '$features/course/api';
  import * as Dialog from '@cio/ui/base/dialog';
  import { goto } from '$app/navigation';
  import { handleAddLessonWidget } from './store';
  import { t } from '$lib/utils/functions/translations';
  import type { ListLessons } from '$features/course/utils/types';

  let errors = $state({
    title: ''
  });
  let lesson: Partial<ListLessons[number]> = $state({
    id: '',
    courseId: courseApi.course?.id || '',
    title: '',
    teacherId: '',
    callUrl: undefined,
    lessonAt: new Date().toDateString(),
    isUnlocked: true,
    videos: null,
    documents: null,
    createdAt: ''
  });
  const courseId = $derived(courseApi.course?.id || '');

  const handleSave = async () => {
    if (!lesson.title?.trim()) {
      errors.title = 'title cannot be empty';
      return;
    }

    if ($handleAddLessonWidget.isSection) {
      await lessonApi.createSection(courseId, {
        title: lesson.title,
        courseId,
        order: lessonApi.sections.length
      });

      if (lessonApi.success && lessonApi.lesson) {
        // Refresh sections list
        await lessonApi.list(courseId);
      }
    } else {
      lesson.sectionId = $handleAddLessonWidget.id || undefined;
      const lessonData = {
        title: lesson.title || '',
        lessonAt: lesson.lessonAt!,
        callUrl: lesson.callUrl!,
        teacherId: lesson.teacherId!,
        isUnlocked: lesson.isUnlocked!,
        sectionId: lesson.sectionId!
      };

      if (lesson.id) {
        await lessonApi.update(courseId, lesson.id, lessonData);
      } else {
        await lessonApi.create(courseId, { ...lessonData, courseId });
      }

      if (lessonApi.success && lessonApi.lesson) {
        const newLesson = lessonApi.lesson;
        lesson.id = newLesson.id;

        // Refresh lessons list
        await lessonApi.list(courseId);

        goto('/courses/' + courseApi.course?.id + '/lessons/' + lesson.id);
      }
    }

    handleClose();
  };

  function handleClose() {
    $handleAddLessonWidget.open = false;

    lesson = {
      id: '',
      courseId: courseApi.course?.id || '',
      title: '',
      callUrl: undefined,
      lessonAt: new Date().toDateString(),
      isUnlocked: true,
      videos: [],
      documents: [],
      createdAt: ''
    };
  }
</script>

<Dialog.Root
  bind:open={$handleAddLessonWidget.open}
  onOpenChange={(isOpen) => {
    if (!isOpen) handleClose();
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {$t(
          `course.navItem.lessons.add_lesson.${$handleAddLessonWidget.isSection ? 'modal_heading_section' : 'modal_heading'}`
        )}
      </Dialog.Title>
    </Dialog.Header>
    <form
      onsubmit={preventDefault(handleSave)}
      class="relative mb-2 flex w-full flex-wrap items-center px-2 py-2 md:mb-4 md:px-5 md:py-3"
    >
      <div class="w-full">
        <InputField
          label={$t(
            `course.navItem.lessons.add_lesson.${
              $handleAddLessonWidget.isSection ? 'lesson_section_title' : 'lesson_title'
            }`
          )}
          bind:value={lesson.title}
          autoFocus={true}
          className="w-full"
          isRequired={true}
          errorMessage={errors.title}
        />
        {#if courseApi.course?.type === 'LIVE_CLASS'}
          <!-- <div
          class="flex items-start justify-evenly gap-1 flex-col lg:flex-row lg:items-center mt-2 w-4/5"
        >
          <div class="lg:mb-0">
            <Select
              bind:value={lesson.profile}
              options={courseApi.group.tutors}
              labelKey="fullname"
              className="sm:my-1 w-[100%]"
            />
          </div>

          <div class="flex items-center lg:mb-0">
            <input
              type="date"
              name="lesson-date-picker"
              class="p-2 my-2 rounded-md sm:w-[179px] dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <div class="flex items-center mb-3 lg:mb-0">
            <InputField className="w-[179px]" placeholder="https://meet.google.com/mga-dsjs-fmb" />
          </div>
        </div> -->
        {/if}
      </div>
    </form>

    <div class="flex flex-row-reverse">
      <Button onclick={handleSave}>
        {$t('course.navItem.lessons.add_lesson.save')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
