<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { dndzone } from 'svelte-dnd-action';
  import UnlockedIcon from 'carbon-icons-svelte/lib/Unlocked.svelte';
  import LockedIcon from 'carbon-icons-svelte/lib/Locked.svelte';
  import SaveIcon from 'carbon-icons-svelte/lib/Save.svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import Calendar from 'carbon-icons-svelte/lib/Calendar.svelte';
  import Video from 'carbon-icons-svelte/lib/Video.svelte';
  import WatsonHealthTextAnnotationToggle from 'carbon-icons-svelte/lib/WatsonHealthTextAnnotationToggle.svelte';
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import { updateLesson } from '$lib/utils/services/courses';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { profile } from '$lib/utils/store/user';
  import {
    lessons,
    handleSaveLesson,
    handleDelete
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course, group } from '$lib/components/Course/store';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import Avatar from '$lib/components/Apps/components/Poll/components/Avatar.svelte';
  import AddLessonModal from '$lib/components/Course/components/Lesson/AddLessonModal.svelte';
  import DateField from '$lib/components/Form/Date.svelte';

  export let data;

  let lessonEditing;
  let isStudent = true;
  let openModal = false;

  const flipDurationMs = 300;

  function formatDate(date) {
    const d = new Date(date);

    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);

    return `${ye}-${mo}-${da}`;
  }

  function addLesson() {
    openModal = true;
  }

  function handleDndConsider(e) {
    $lessons = e.detail.items;
  }

  function handleDndFinalize(e) {
    const prevLessonsByOrder = $lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.order }), {});
    $lessons = e.detail.items;

    // Only update the lesson order that changed
    e.detail.items.forEach((item, index) => {
      const order = index + 1;

      if (order !== prevLessonsByOrder[item.id]) {
        $lessons[index].order = order;
        updateLesson({ order }, item.id).then((update) =>
          console.log(`updated lesson order`, update)
        );
      }
    });
  }

  function getLessonOrder(id) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);

    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  $: {
    const user = $group.people.find((person) => person.profile_id === $profile.id);

    if (user) {
      isStudent = user.role_id === 3;
    }
  }
</script>

<AddLessonModal {isStudent} bind:openModal />

<CourseContainer bind:isStudent bind:courseId={data.courseId}>
  <PageNav title="Lessons">
    <div slot="widget">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton label="Add" onClick={addLesson} isDisabled={!!lessonEditing} />
      </RoleBasedSecurity>
    </div>
  </PageNav>

  <PageBody width="max-w-6xl" padding="p-0">
    {#if $lessons.length}
      <section
        class="w-full lg:w-11/12 p-3 lg:px-4 m-auto"
        use:dndzone={{
          items: $lessons,
          flipDurationMs,
          dragDisabled: isStudent,
          dropTargetStyle: {
            border: '2px #1d4ed8 solid',
            'border-style': 'dashed'
          }
        }}
        on:consider={handleDndConsider}
        on:finalize={handleDndFinalize}
      >
        {#each $lessons as lesson (lesson.id)}
          <div
            class="sm:min-h-[245px] md:min-h-[100px] lg:min-h-[190px] relative m-auto rounded-md border-2 border-gray-200 py-3 px-5 mb-4 flex items-center dark:bg-neutral-800"
          >
            <div class="mr-5">
              <TextChip
                value={getLessonOrder(lesson.id)}
                size="sm"
                shape="rounded-full"
                className="bg-primary-200 text-primary-600 text-xs"
              />
            </div>

            <div class="w-4/5">
              {#if lessonEditing === lesson.id}
                <TextField bind:value={lesson.title} autofocus={true} className="max-w-lg" />
              {:else}
                <h3 class="dark:text-white text-xl m-0 flex items-center">
                  <a
                    href={isStudent && !lesson.is_unlocked
                      ? $page.url.pathname
                      : '/courses/' + $course.id + '/lessons/' + lesson.id}
                    class="dark:text-white no-underline hover:underline font-semibold text-black {isStudent &&
                    !lesson.is_unlocked
                      ? 'cursor-not-allowed'
                      : ''}"
                  >
                    {lesson.title}
                  </a>
                </h3>
              {/if}
              <!-- <div class="flex items-center mb-2">
              <div class="flex items-center mr-2">
                {resources.map((r) => `${r.value} ${r.label}`).join(', ')}
              </div>
            </div> -->

              <div
                class="flex items-start justify-between flex-col lg:flex-row lg:items-center mt-2 w-4/5"
              >
                <div class="lg:mb-0">
                  {#if lessonEditing === lesson.id}
                    <Select
                      bind:value={lesson.profile}
                      options={$group.tutors}
                      labelKey="fullname"
                      className="sm:my-1 w-[100%]"
                    />
                  {:else if !lesson.profile}
                    <p class="dark:text-white ml-2 text-sm mb-3">No tutor added</p>
                  {:else}
                    <a href="." class="flex items-center hover:underline mb-2">
                      <Avatar
                        className="w-6 h-6"
                        src={lesson.profile.avatar_url}
                        name="Avatar placeholder"
                      />
                      <p class="dark:text-white ml-2 text-sm">
                        {lesson.profile.fullname}
                      </p>
                    </a>
                  {/if}
                </div>

                <div class="flex items-center lg:mb-0">
                  {#if lessonEditing === lesson.id}
                    <DateField
                      value={formatDate(lesson.lesson_at)}
                      className="p-2 my-2 rounded-md sm:w-[179px] dark:bg-neutral-800 dark:text-white"
                      onChange={(e) => (lesson.lesson_at = e.target.value)}
                    />
                  {:else}
                    <div class="flex mb-2">
                      <Calendar size={20} class="carbon-icon text-gray-400 dark:text-white" />
                      <p class="dark:text-white text-sm ml-2">
                        {new Date(lesson.lesson_at).toDateString()}
                      </p>
                    </div>
                  {/if}
                </div>

                <div class="flex items-center mb-3 lg:mb-0">
                  {#if lessonEditing === lesson.id}
                    <TextField
                      bind:value={lesson.call_url}
                      autofocus={true}
                      className="w-[179px]"
                      placeholder="https://meet.google.com/mga-dsjs-fmb"
                    />
                  {:else}
                    <div class="flex">
                      <Video size={20} class="carbon-icon text-gray-400 dark:text-white ml-0.5" />
                      <a
                        class="text-sm ml-2 text-primary-600"
                        href={lesson.call_url || '#'}
                        target="_blank"
                      >
                        {lesson.call_url ? 'Join lesson' : 'No link'}
                      </a>
                    </div>
                  {/if}
                </div>
              </div>

              <div class="flex flex-row absolute sm:bottom-20 bottom-10 right-10">
                <div class="success hidden md:block">
                  <IconButton
                    disabled={isStudent}
                    onClick={() => {
                      lesson.is_unlocked = !lesson.is_unlocked;
                      handleSaveLesson(lesson, $course.id);
                    }}
                    toolTipProps={isStudent
                      ? {}
                      : {
                          title: `Click to ${lesson.is_unlocked ? 'lock' : 'unlock'}`,
                          direction: 'right'
                        }}
                  >
                    {#if lesson.is_unlocked}
                      <UnlockedIcon size={24} class="carbon-icon dark:text-white" />
                    {:else}
                      <LockedIcon size={24} class="carbon-icon dark:text-white" />
                    {/if}
                  </IconButton>
                </div>

                <RoleBasedSecurity allowedRoles={[1, 2]}>
                  <div class="hidden md:block">
                    {#if lessonEditing === lesson.id}
                      <IconButton
                        onClick={() => {
                          lessonEditing = null;
                          handleSaveLesson(lesson, $course.id);
                        }}
                      >
                        <SaveIcon size={24} class="carbon-icon dark:text-white" />
                      </IconButton>
                    {:else}
                      <IconButton onClick={() => (lessonEditing = lesson.id)}>
                        <WatsonHealthTextAnnotationToggle
                          size={32}
                          class="carbon-icon dark:text-white"
                        />
                      </IconButton>
                    {/if}
                  </div>
                </RoleBasedSecurity>

                <RoleBasedSecurity allowedRoles={[1, 2]}>
                  <div class="hidden md:block">
                    <IconButton onClick={handleDelete(lesson.id)}>
                      <TrashCanIcon size={24} class="carbon-icon dark:text-white" />
                    </IconButton>
                  </div>
                </RoleBasedSecurity>

                <RoleBasedSecurity allowedRoles={[1, 2]}>
                  <div class="overflowmenu">
                    <OverflowMenu size="xl" class="block absolute right-10 bottom-4 pl-4">
                      <OverflowMenuItem
                        disabled={isStudent}
                        text={lesson.is_unlocked ? 'Lock' : 'Unlock'}
                        on:click={() => {
                          lesson.is_unlocked = !lesson.is_unlocked;
                          handleSaveLesson(lesson, $course.id);
                        }}
                      />
                      <OverflowMenuItem
                        text={lessonEditing === lesson.id ? 'Save' : 'Edit'}
                        on:click={() => {
                          if (lessonEditing === lesson.id) {
                            lessonEditing = null;
                            handleSaveLesson(lesson, $course.id);
                          } else {
                            lessonEditing = lesson.id;
                          }
                        }}
                      />
                      <OverflowMenuItem danger text="Delete" on:click={handleDelete(lesson.id)} />
                    </OverflowMenu>
                  </div>
                </RoleBasedSecurity>
              </div>
            </div>
          </div>
        {:else}
          <Box>
            <div class="flex justify-between flex-col items-center w-[90%] md:w-96">
              <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="my-2.5 mx-auto" />
              <h2 class="text-xl my-1.5 font-normal">No lessons yet</h2>
              <p class="text-sm text-center text-slate-500">
                Share your knowledge with the world by creating engaging lessons. Start by clicking
                on the Add button.
              </p>
            </div>
          </Box>
        {/each}
      </section>
    {:else}
      <Box className="w-full lg:w-11/12 lg:px-4 m-auto">
        <div class="flex justify-between flex-col items-center">
          <img src="/images/empty-lesson-icon.svg" alt="Lesson" class="my-2.5 mx-auto" />
          <h2 class="text-xl my-1.5 font-normal">No lessons yet</h2>
          <p class="text-sm text-center text-slate-500">
            Share your knowledge with the world by creating engaging lessons. Start by clicking on
            the Add button.
          </p>
        </div>
      </Box>
    {/if}
  </PageBody>
</CourseContainer>

<style>
  @media (min-width: 760px) {
    .overflowmenu {
      display: none !important;
    }
  }
</style>
