<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import {
    lessons,
    handleSaveLesson
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course, group } from '$lib/components/Course/store';
  import Modal from '$lib/components/Modal/index.svelte';
  import { goto } from '$app/navigation';
  import { handleAddLessonWidget } from '../Navigation/store';
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
    lesson_completion: []
  };

  const handleSave = async () => {
    if (!lesson.title.trim()) {
      errors.title = 'title cannot be empty';
      return;
    }
    const savedLesson = await handleSaveLesson(lesson, $course.id);

    if (Array.isArray(savedLesson) && savedLesson[0]) {
      const newLesson = savedLesson[0];
      lesson.id = newLesson.id;
      $lessons = [...$lessons, lesson];
      goto('/courses/' + $course.id + '/lessons/' + lesson.id);
    }

    $handleAddLessonWidget.open = false;
  };

</script>

<Modal

  onClose={() => ($handleAddLessonWidget.open = false)}
  bind:open={$handleAddLessonWidget.open}
  width="w-[80%] md:w-[65%]"
  maxWidth="max-w-2xl"
  containerClass="overflow-hidden"
  modalHeading={$t('course.navItem.lessons.add_lesson.modal_heading')}
>

<!-- used form to handle enter keydown event naturally -->
<form on:submit|preventDefault={handleSave} class="relative m-auto py-2 md:py-3 px-2 md:px-5 mb-2 md:mb-4 flex flex-wrap items-center dark:bg-neutral-800">
    <div class="w-full">
      <TextField
        label={$t('course.navItem.lessons.add_lesson.lesson_title')}
        bind:value={lesson.title}
        autoFocus={true}
        className="flex-1 min-w-lg max-w-lg"
        isRequired={true}
        errorMessage={errors.title}
      />
      {#if $course.type == COURSE_TYPE.LIVE_CLASS}
        <div
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
        </div>
      {/if}
    </div>
  </form>

  <div class="flex flex-row-reverse ">
    <PrimaryButton label={$t('course.navItem.lessons.add_lesson.save')} onClick={handleSave} />
  </div>
</Modal>