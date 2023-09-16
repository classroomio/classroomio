<script>
  import UnlockedIcon from 'carbon-icons-svelte/lib/Unlocked.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import {
    lessons,
    handleSaveLesson
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course, group } from '$lib/components/Course/store';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { goto } from '$app/navigation';

  export let openModal = false;
  export let isStudent;
  let errors = {};
  let lesson = {
    id: null,
    title: 'Untitled lesson',
    profile: undefined,
    call_url: undefined,
    lesson_at: new Date(),
    is_unlocked: false,
    is_complete: false
  };

  function getLessonOrder(id) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);
    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  const handleSave = async () => {
    if (lesson.title.trim() === '') {
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
    openModal = false;
  };
</script>

<Modal
  onClose={() => (openModal = false)}
  bind:open={openModal}
  width="w-[80%] md:w-[60%]"
  containerClass="overflow-hidden"
  modalHeading="Add New Lesson"
>
  <div
    class="sm:min-h-[245px] md:min-h-[100px] lg:min-h-[190px] relative m-auto rounded-md border-2 border-gray-200 py-2 md:py-3 px-2 md:px-5 mb-2 md:mb-4 flex flex-wrap items-center dark:bg-neutral-800"
  >
    <div class="mr-5">
      <TextChip
        value={getLessonOrder(lesson.id)}
        size="sm"
        shape="rounded-full"
        className="bg-primary-200 text-primary-600 text-xs"
      />
    </div>

    <div class="w-full md:w-4/5">
      <div class="flex flex-row gap-1 md:gap-2">
        <TextField
          bind:value={lesson.title}
          autofocus={true}
          className=" flex-1 min-w-lg max-w-lg"
          isRequired={true}
          errorMessage={errors.title}
        />
        <IconButton
          disabled={isStudent}
          toolTipProps={isStudent
            ? {}
            : {
                title: `Click to ${lesson.is_unlocked ? 'lock' : 'unlock'}`,
                direction: 'right'
              }}
        >
          <button
            on:click={() => {
              lesson.is_unlocked = !lesson.is_unlocked;
              handleSaveLesson(lesson, $course.id);
            }}
            class="p-1"
          >
            {#if lesson.is_unlocked}
              <UnlockedIcon size={24} class="carbon-icon dark:text-white" />
            {:else}
              <LockedIcon size={24} class="carbon-icon dark:text-white" />
            {/if}
          </button>
        </IconButton>
      </div>

      <div class="flex items-start justify-between flex-col lg:flex-row lg:items-center mt-2 w-4/5">
        <div class="lg:mb-0">
          <Select
            bind:value={lesson.profile}
            options={$group.tutors}
            labelKey="fullname"
            className="sm:my-1 w-[100%]"
          />
        </div>

        <div class="flex items-center lg:mb-0">
          <input type="date" name="lesson-date-picker" class="p-2 my-2 rounded-md sm:w-[179px]" />
        </div>

        <div class="flex items-center mb-3 lg:mb-0">
          <TextField className="w-[179px]" placeholder="https://meet.google.com/mga-dsjs-fmb" />
        </div>
      </div>
    </div>
  </div>
  <PrimaryButton label="Save" onClick={handleSave} />
</Modal>
