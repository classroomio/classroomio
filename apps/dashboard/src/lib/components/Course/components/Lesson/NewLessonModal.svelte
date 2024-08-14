<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  // import Select from '$lib/components/Form/Select.svelte';
  import {
    lessons,
    lessonSections,
    handleSaveLesson,
    handleSaveLessonSection
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import Modal from '$lib/components/Modal/index.svelte';
  import { goto } from '$app/navigation';
  import { handleAddLessonWidget } from './store';
  import { t } from '$lib/utils/functions/translations';
  import { COURSE_TYPE } from '$lib/utils/types';
  import type { Lesson } from '$lib/utils/types';

  let errors = {
    title: ''
  };
  let lesson: Lesson = {
    id: '',
    course_id: $course.id || '',
    title: '',
    profile: undefined,
    call_url: undefined,
    lesson_at: new Date().toDateString(),
    is_unlocked: true,
    lesson_completion: [],
    created_at: ''
  };

  const handleSave = async () => {
    if (!lesson.title.trim()) {
      errors.title = 'title cannot be empty';
      return;
    }

    if ($handleAddLessonWidget.isSection) {
      const savedSection = await handleSaveLessonSection(
        {
          title: lesson.title,
          order: $lessonSections.length
        },
        $course.id
      );

      if (Array.isArray(savedSection) && savedSection[0]) {
        const newLessonSection = savedSection[0];

        lessonSections.update((sections) => {
          return [
            ...sections,
            {
              id: newLessonSection.id,
              title: lesson.title,
              order: newLessonSection.order,
              course_id: newLessonSection.course_id,
              lessons: [],
              created_at: ''
            }
          ];
        });
      }
    } else {
      lesson.section_id = $handleAddLessonWidget.id || undefined;
      const savedLesson = await handleSaveLesson(lesson, $course.id);

      if (Array.isArray(savedLesson) && savedLesson[0]) {
        const newLesson = savedLesson[0];
        lesson.id = newLesson.id;
        $lessons = [...$lessons, lesson];

        lessonSections.update((sections) =>
          sections.map((s) => {
            if (s.id === newLesson.section_id) {
              s.lessons = [...s.lessons, lesson];
            }

            return s;
          })
        );
        goto('/courses/' + $course.id + '/lessons/' + lesson.id);
      }
    }

    handleClose();
  };

  function handleClose() {
    $handleAddLessonWidget.open = false;

    lesson = {
      id: '',
      course_id: $course.id || '',
      title: '',
      profile: undefined,
      call_url: undefined,
      lesson_at: new Date().toDateString(),
      is_unlocked: true,
      lesson_completion: [],
      created_at: ''
    };
  }
</script>

<Modal
  onClose={handleClose}
  bind:open={$handleAddLessonWidget.open}
  width="w-[80%] md:w-[65%]"
  maxWidth="max-w-2xl"
  containerClass="overflow-hidden"
  modalHeading={$t(
    `course.navItem.lessons.add_lesson.${
      $handleAddLessonWidget.isSection ? 'modal_heading_section' : 'modal_heading'
    }`
  )}
>
  <form
    on:submit|preventDefault={handleSave}
    class="relative m-auto py-2 md:py-3 px-2 md:px-5 mb-2 md:mb-4 flex flex-wrap items-center dark:bg-neutral-800"
  >
    <div class="w-full">
      <TextField
        label={$t(
          `course.navItem.lessons.add_lesson.${
            $handleAddLessonWidget.isSection ? 'lesson_section_title' : 'lesson_title'
          }`
        )}
        bind:value={lesson.title}
        autoFocus={true}
        className="flex-1 min-w-lg max-w-lg"
        isRequired={true}
        errorMessage={errors.title}
      />
      {#if $course.type == COURSE_TYPE.LIVE_CLASS}
        <!-- <div
          class="flex items-start justify-evenly gap-1 flex-col lg:flex-row lg:items-center mt-2 w-4/5"
        >
          <div class="lg:mb-0">
            <Select
              bind:value={lesson.profile}
              options={$group.tutors}
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
            <TextField className="w-[179px]" placeholder="https://meet.google.com/mga-dsjs-fmb" />
          </div>
        </div> -->
      {/if}
    </div>
  </form>

  <div class="flex flex-row-reverse">
    <PrimaryButton label={$t('course.navItem.lessons.add_lesson.save')} onClick={handleSave} />
  </div>
</Modal>
