<script lang="ts">
  import { page } from '$app/stores';
  import { dndzone } from 'svelte-dnd-action';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { updateLesson } from '$lib/utils/services/courses';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import {
    lessons,
    handleDelete,
    handleSaveLesson
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import PageBody from '$lib/components/PageBody/index.svelte';

  import AddLessonModal from '$lib/components/Course/components/Lesson/AddLessonModal.svelte';
  import DeleteLessonConfirmation from '$lib/components/Course/components/Lesson/DeleteLessonConfirmation.svelte';
  import { handleAddLessonWidget } from '$lib/components/Course/components/Navigation/store';
  import { Video, Calendar } from 'carbon-icons-svelte';
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import Select from '$lib/components/Form/Select.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import Avatar from '$lib/components/Apps/components/Poll/components/Avatar.svelte';
  import { course, group } from '$lib/components/Course/store';
  import DateField from '$lib/components/Form/Date.svelte';
  import type { Lesson } from '$lib/utils/types';

  export let data;

  let lessonEditing: string | undefined;
  let lessonToDelete: Lesson | undefined;
  let isStudent = true;
  let openDeleteModal = false;

  const flipDurationMs = 300;

  function addLesson() {
    $handleAddLessonWidget.open = true;
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

  function formatDate(date: string | undefined) {
    if (!date) return '';
    const d = new Date(date);

    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);

    return `${ye}-${mo}-${da}`;
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

{#if $handleAddLessonWidget}
  <AddLessonModal {isStudent} />
{/if}

<DeleteLessonConfirmation
  bind:openDeleteModal
  lessonTitle={lessonToDelete?.title || ''}
  deleteLesson={() => handleDelete(lessonToDelete?.id)}
/>

<!-- TODO: Refactor usage of two way binding isStudent, rather use $globalStore.isStudent -->
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
            class="relative m-auto max-w-xl rounded-md border-2 border-gray-200 p-5 mb-4 flex items-center dark:bg-neutral-800"
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
                <TextField bind:value={lesson.title} autoFocus={true} className="max-w-lg" />
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

              <!-- Lesson Educator -->
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

                <!-- Lesson Date -->
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
                        {new Date(lesson.lesson_at || '').toDateString()}
                      </p>
                    </div>
                  {/if}
                </div>

                <!-- Lesson Call url -->
                <div class="flex items-center mb-3 lg:mb-0">
                  {#if lessonEditing === lesson.id}
                    <TextField
                      bind:value={lesson.call_url}
                      autoFocus={true}
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
            </div>

            <!-- 3 dot edit -->
            <div class="flex flex-row">
              <RoleBasedSecurity allowedRoles={[1, 2]}>
                <OverflowMenu flipped size="xl" class="absolute top-0 right-0">
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
                        lessonEditing = undefined;
                        handleSaveLesson(lesson, $course.id);
                      } else {
                        lessonEditing = lesson.id;
                      }
                    }}
                  />
                  <OverflowMenuItem danger text="Delete" on:click={() => handleDelete(lesson.id)} />
                </OverflowMenu>
              </RoleBasedSecurity>
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
