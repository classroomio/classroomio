<script context="module">
  export async function preload({ params }) {
    return { courseId: params.id };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { stores } from '@sapper/app';
  import { dndzone } from 'svelte-dnd-action';
  import Time24 from 'carbon-icons-svelte/lib/Time24';
  import Edit24 from 'carbon-icons-svelte/lib/Edit24';
  import Save24 from 'carbon-icons-svelte/lib/Save24';
  import Phone24 from 'carbon-icons-svelte/lib/Phone24';
  import Delete24 from 'carbon-icons-svelte/lib/Delete24';
  import CheckmarkFilled24 from 'carbon-icons-svelte/lib/CheckmarkFilled24';
  import PageNav from '../../../../components/PageNav/index.svelte';
  import RoleBasedSecurity from '../../../../components/RoleBasedSecurity/index.svelte';
  import Box from '../../../../components/Box/index.svelte';
  import PageBody from '../../../../components/PageBody/index.svelte';
  import PrimaryButton from '../../../../components/PrimaryButton/index.svelte';
  import TextField from '../../../../components/Form/TextField.svelte';
  import IconButton from '../../../../components/IconButton/index.svelte';
  import Select from '../../../../components/Form/Select.svelte';
  import {
    fetchCourse,
    updateLesson,
  } from '../../../../utils/services/courses';
  import CourseContainer from '../../../../components/CourseContainer/index.svelte';
  import { profile } from '../../../../utils/store/user';
  import {
    lessons,
    handleAddLesson,
    handleSaveLesson,
    handleDelete,
  } from '../../../../components/Course/components/Lesson/store/lessons';
  import {
    course,
    setCourse,
    group,
  } from '../../../../components/Course/store';

  export let courseId;

  let lessonEditing;
  let ref;
  let isStudent = true;

  const { page } = stores();
  const flipDurationMs = 300;

  function formatDate(date) {
    const d = new Date(date);

    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);

    return `${ye}-${mo}-${da}`;
  }

  // TODO: CRUD of lessons
  function addLesson() {
    handleAddLesson();
    setTimeout(() => {
      lessonEditing = $lessons.length - 1;
      if (ref) {
        ref.scrollIntoView({
          block: 'start',
          behavior: 'smooth',
          inline: 'nearest',
        });
      }
    }, 100);
  }

  function handleDndConsider(e) {
    $lessons = e.detail.items;
  }

  function handleDndFinalize(e) {
    const prevLessonsByOrder = $lessons.reduce(
      (acc, l) => ({ ...acc, [l.id]: l.order }),
      {}
    );
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

    return index + 1;
  }

  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourse(data);
  });

  $: {
    const user = $group.people.find(
      (person) => person.profile_id === $profile.id
    );

    if (user) {
      isStudent = user.role_id === 3;
    }
  }
</script>

<CourseContainer bind:isStudent>
  <PageNav title="Lessons">
    <div slot="widget">
      <RoleBasedSecurity allowedRoles="[1,2]">
        <PrimaryButton
          label="Add"
          onClick={addLesson}
          isDisabled={!!lessonEditing}
        />
      </RoleBasedSecurity>
    </div>
  </PageNav>

  <PageBody padding="p-0">
    <section
      class="w-full lg:w-11/12 py-3 px-3 lg:px-4 m-auto lesson-list"
      use:dndzone={{
        items: $lessons,
        flipDurationMs,
        dragDisabled: isStudent,
        dropTargetStyle: {
          border: '2px #1d4ed8 solid',
          'border-style': 'dashed',
        },
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#each $lessons as lesson (lesson.id)}
        <div
          bind:this={ref}
          class="group relative m-auto rounded-md border-2 border-gray-100 py-3 px-5 mb-4 flex items-center hover:shadow-2xl shadow-md transition delay-150 duration-300 ease-in-out"
        >
          <!-- Complete or Not complete icon -->
          <div class="absolute -left-6 -top-6 success">
            <IconButton
              disabled={isStudent}
              onClick={() => {
                lesson.is_complete = !lesson.is_complete;
                handleSaveLesson(lesson, $course.id);
              }}
              toolTipProps={isStudent
                ? {}
                : {
                    title: `Click to ${lesson.is_complete ? 'lock' : 'unlock'}`,
                    direction: 'right',
                  }}
            >
              {#if lesson.is_complete}
                <CheckmarkFilled24 class="carbon-icon" />
              {:else}
                <span class="text-2xl">🔒</span>
              {/if}
            </IconButton>
          </div>

          <RoleBasedSecurity allowedRoles="[1,2]">
            <!-- Edit/Save -->
            <div class="absolute -top-2 -right-2">
              {#if lessonEditing === lesson.id}
                <IconButton
                  onClick={() => {
                    lessonEditing = null;
                    handleSaveLesson(lesson, $course.id);
                  }}
                >
                  <Save24 class="carbon-icon" />
                </IconButton>
              {:else}
                <IconButton onClick={() => (lessonEditing = lesson.id)}>
                  <Edit24 class="carbon-icon" />
                </IconButton>
              {/if}
            </div>
          </RoleBasedSecurity>

          <div class="">
            <h3 class="dark:text-white text-3xl font-bold">
              {getLessonOrder(lesson.id)}.
            </h3>
          </div>
          <div class="ml-8 w-4/5">
            {#if lessonEditing === lesson.id}
              <TextField bind:value={lesson.title} autofocus={true} />
            {:else}
              <h3 class="dark:text-white text-2xl m-0 flex items-center">
                <a
                  href={isStudent && !lesson.is_complete
                    ? $page.path
                    : '/courses/' + $course.id + '/lessons/' + lesson.id}
                  class="hover:underline text-black {isStudent &&
                  !lesson.is_complete
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
              class="flex items-start justify-between flex-col lg:flex-row lg:items-center mt-6 w-full"
            >
              <div class="mb-3 lg:mb-0">
                {#if lessonEditing === lesson.id}
                  <Select
                    bind:value={lesson.profile}
                    options={$group.tutors}
                    labelKey="fullname"
                  />
                {:else if !lesson.profile}
                  <p class="dark:text-white ml-2 text-sm">No tutor added</p>
                {:else}
                  <a href="." class="flex items-center hover:underline">
                    <img
                      alt="Placeholder"
                      class="block rounded-full"
                      width="24"
                      height="20"
                      src={lesson.profile.avatar_url}
                    />
                    <p class="dark:text-white ml-2 text-sm">
                      {lesson.profile.fullname}
                    </p>
                  </a>
                {/if}
              </div>

              <div class="flex items-center mb-3 lg:mb-0">
                {#if lessonEditing === lesson.id}
                  <input
                    type="date"
                    name="lesson-date-picker"
                    class="p-2 rounded-md w-40"
                    value={formatDate(lesson.lesson_at)}
                    on:input={(e) => (lesson.lesson_at = e.target.value)}
                  />
                {:else}
                  <Time24 class="carbon-icon" />
                  <p class="dark:text-white text-md ml-2">
                    {new Date(lesson.lesson_at).toDateString()}
                  </p>
                {/if}
              </div>

              <div class="flex items-center mb-3 lg:mb-0">
                {#if lessonEditing === lesson.id}
                  <TextField
                    bind:value={lesson.call_url}
                    autofocus={true}
                    className="w-40"
                    placeholder="https://meet.google.com/mga-dsjs-fmb"
                  />
                {:else}
                  <Phone24 class="carbon-icon" />
                  <a
                    class="text-md ml-2"
                    href={lesson.call_url || '#'}
                    target="_blank"
                  >
                    {lesson.call_url ? 'Join lesson' : 'No link'}
                  </a>
                {/if}
              </div>
            </div>
          </div>

          <RoleBasedSecurity allowedRoles="[1,2]">
            <div class="absolute bottom-2 right-0">
              <IconButton onClick={handleDelete(lesson.id)}>
                <Delete24 class="carbon-icon" />
              </IconButton>
            </div>
          </RoleBasedSecurity>
        </div>
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500 dark:text-gray-200">
            No lesson added
          </h3>
          <img alt="No lesson added" src="/notfound2.gif" class="w-80" />
        </Box>
      {/each}
    </section>
  </PageBody>
</CourseContainer>

<style>
  .lesson-list {
    overflow-y: auto;
    height: 84vh;
  }
  .group {
    min-height: 170px;
    background-color: #fafafa;
  }
</style>
