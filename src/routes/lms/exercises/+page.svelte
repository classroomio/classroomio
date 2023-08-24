<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import MarkExerciseModal from '$lib/components/Course/components/Lesson/Exercise/MarkExerciseModal.svelte';
  import Chip from '$lib/components/Chip/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { fetchCourse } from '$lib/utils/services/courses';
  import { setCourse, course } from '$lib/components/Course/store';
  import {
    fetchSubmissions,
    updateSubmission,
    updateQuestionAnswer
  } from '$lib/utils/services/submissions';
  import { formatAnswers } from '$lib/components/Course/function';
  import { snackbarStore } from '$lib/components/Snackbar/store';
  import { SNACKBAR_SEVERITY } from '$lib/components/Snackbar/constants';
  import isSubmissionEarly from '$lib/utils/functions/isSubmissionEarly';
  import formatDate from '$lib/utils/functions/formatDate';

  const flipDurationMs = 300;

  // export let data;
  // const { courseId } = data;
  let items;

  let sections = [
    {
      id: 1,
      title: 'Pending',
      value: 0,
      items: [
        {
          id: 1,
          statusId: 'pending',
          isEarly: true,
          submittedAt: '5 min ago',
          exercise: {
            id: 1,
            title: 'Ai for dummies'
          },
          // answers,
          student: {
            username: 'user'
          },
          lesson: {
            id: 1,
            title: 'Introduction to AI'
          }
        }
      ],
      className: 'text-[#E35353] bg-[#FDDFE4]'
    },
    {
      id: 2,
      title: 'Submitted',
      value: 0,
      items: [
        {
          id: 2,
          statusId: 'pending',
          isEarly: true,
          submittedAt: '5 min ago',
          exercise: {
            id: 2,
            title: 'Digital photography for dummies'
          },
          // answers,
          student: {
            username: 'user'
          },
          lesson: {
            id: 2,
            title: 'Introduction to Photography'
          }
        }
      ],
      className: 'text-[#0233BD] bg-[#D9E0F5]'
    },
    {
      id: 3,
      title: 'Graded',
      value: 0,
      items: [
        {
          id: 3,
          statusId: 'pending',
          isEarly: true,
          submittedAt: '5 min ago',
          exercise: {
            id: 3,
            title: 'Landscaping and its deep secrets'
          },
          // answers,
          student: {
            username: 'user'
          },
          lesson: {
            id: 1,
            title: 'Introduction to Landscape'
          }
        }
      ],
      className: 'text-[#0F9D58] bg-[#E2FEEA]'
    }
  ];

  function handleItemFinalize(columnIdx, newItems) {
    let itemToWithNewStatus;

    const { id } = sections[columnIdx];

    // Set column in the UI
    sections[columnIdx].items = newItems.map((item) => {
      if (item.statusId !== id) {
        itemToWithNewStatus = item;
        item.statusId = id;
      }

      return item;
    });

    // // Update backend
    // if (itemToWithNewStatus) {
    //   // Update key mapping for each submission also
    //   submissionIdData[itemToWithNewStatus.id] = {
    //     ...submissionIdData[itemToWithNewStatus.id],
    //     status_id: itemToWithNewStatus.statusId
    //   };
    //   console.log(
    //     `submissionIdData[itemToWithNewStatus.id]`,
    //     submissionIdData[itemToWithNewStatus.id]
    //   );

    //   updateSubmission({
    //     id: itemToWithNewStatus.id,
    //     status_id: itemToWithNewStatus.statusId
    //   }).then((res) => console.log('Updated submission', res));
    // }
  }

  function handleDndConsiderCards(columnIdx) {
    return function (e) {
      sections[columnIdx].items = e.detail.items;
    };
  }

  function handleDndFinalizeCards(columnIdx) {
    return (e) => handleItemFinalize(columnIdx, e.detail.items);
  }
</script>

<section class="max-w-6xl mx-auto">
  <div class="m-5">
    <h1 class="text-3xl font-semibold my-4">Exercises</h1>
    <div class="flex items-center w-full">
      {#each sections as { id, title, items, className }, idx (id)}
        <div
          class="min-w-[355px] max-w-[355px] h-[516px] rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-50 p-3 mr-3 overflow-hidden"
          animate:flip={{ duration: flipDurationMs }}
        >
          <div class="flex items-center mb-2 gap-2">
            <p class="dark:text-white ml-2 font-bold">{title}</p>
            <Chip value={items.length} {className} />
          </div>
          <div
            class="content pr-2 overflow-y-auto mb-3"
            use:dndzone={{
              items,
              flipDurationMs,
              dropTargetStyle: { outline: 'blue' }
            }}
            on:consider={handleDndConsiderCards(idx)}
            on:finalize={handleDndFinalizeCards(idx)}
          >
            {#if items.length === 0}
              <div
                class="h-[100px]"
                use:dndzone={{
                  items: [], // Empty array for placeholder
                  flipDurationMs,
                  dropTargetStyle: { outline: 'blue' }
                }}
                on:consider={handleDndConsiderCards(idx)}
                on:finalize={handleDndFinalizeCards(idx)}
              >
                <!-- Placeholder content -->
                <p class="text-gray-500 dark:text-gray-400 text-left p-2">
                  drop your {title} exercises here
                </p>
              </div>
            {:else}
              {#each items as item (item.id)}
                <div
                  class=" w-full my-2 mx-0 rounded-md bg-white dark:bg-gray-600 py-3 px-3"
                  animate:flip={{ duration: flipDurationMs }}
                >
                  <a
                    class="flex w-full items-center cursor-pointer text-black mb-2"
                    href={`${$page.url.pathname}?submissionId=${item.id}`}
                  >
                    <!-- <img
              alt="Student avatar"
              class="block rounded-full h-6 w-6"
              src={item.student.avatar_url}
            /> -->
                    <p class="dark:text-white ml-2 text-sm">
                      {item.student.username}
                    </p>
                  </a>
                  <a
                    class="text-primary-700 text-md font-bold"
                    href="{$page.url.pathname}?submissionId={item.id}"
                  >
                    {item.exercise.title}
                  </a>
                  <a
                    class="flex items-center no-underline hover:underline text-black my-2"
                    href="{$page.url?.pathname?.replace('submissions', 'lessons')}/{item.lesson
                      .id}/exercises/{item.exercise.id}"
                  >
                    <p class="dark:text-white text-grey text-sm">
                      #{item.lesson.title}
                      {`${item.tutor ? 'created by' + item.tutor.name : ''}`}
                    </p>
                  </a>
                  <p class="dark:text-white text-gray-500 text-xs">
                    {item.submittedAt}
                  </p>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
