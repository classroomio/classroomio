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
  import { snackbar } from '$lib/components/Snackbar/store';
  import isSubmissionEarly from '$lib/utils/functions/isSubmissionEarly';
  import formatDate from '$lib/utils/functions/formatDate';

  const flipDurationMs = 300;

  export let data;
  const { courseId } = data;

  let sections = [
    {
      id: 1,
      title: 'Submitted',
      value: 0,
      items: []
    },
    {
      id: 2,
      title: 'In Progress',
      value: 0,
      items: []
    },
    {
      id: 3,
      title: 'Graded',
      value: 10,
      items: []
    }
  ];
  let submissionIdData = {};
  let submissionId;

  let openExercise = false;

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

    // Update backend
    if (itemToWithNewStatus) {
      // Update key mapping for each submission also
      submissionIdData[itemToWithNewStatus.id] = {
        ...submissionIdData[itemToWithNewStatus.id],
        status_id: itemToWithNewStatus.statusId
      };
      console.log(
        `submissionIdData[itemToWithNewStatus.id]`,
        submissionIdData[itemToWithNewStatus.id]
      );

      updateSubmission({
        id: itemToWithNewStatus.id,
        status_id: itemToWithNewStatus.statusId
      }).then((res) => console.log('Updated submission', res));
    }
  }

  function handleDndConsiderCards(columnIdx) {
    return function (e) {
      sections[columnIdx].items = e.detail.items;
    };
  }

  function handleDndFinalizeCards(columnIdx) {
    return (e) => handleItemFinalize(columnIdx, e.detail.items);
  }

  function handleModalClose() {
    goto($page.url.pathname);
  }

  // Via dialog
  function updateStatus({ submissionId, prevStatusId, nextStatusId, total }) {
    let itemToWithNewStatus;

    // Remove from current column
    const { items } = sections[prevStatusId - 1];
    sections[prevStatusId - 1].items = items.filter((item) => {
      if (item.id === submissionId) {
        itemToWithNewStatus = Object.assign(item);
        itemToWithNewStatus.statusId = nextStatusId;
        return false;
      }

      return true;
    });
    console.log(`itemToWithNewStatus`, itemToWithNewStatus);
    // Move to right column
    sections[nextStatusId - 1].items = [...sections[nextStatusId - 1].items, itemToWithNewStatus];

    // If something changed
    if (itemToWithNewStatus) {
      // Update key mapping for each submission also
      submissionIdData[itemToWithNewStatus.id] = {
        ...submissionIdData[itemToWithNewStatus.id],
        status_id: itemToWithNewStatus.statusId
      };

      // Update backend
      updateSubmission({
        id: itemToWithNewStatus.id,
        status_id: itemToWithNewStatus.statusId,
        total
      }).then((res) => console.log('Updated submission', res));
    }
  }

  async function handleSave(submission) {
    const { questionAnswerByPoint, questionAnswers } = submission;

    let totalPoints = 0;

    const updates = Object.keys(questionAnswerByPoint).map((questionId) => {
      const questionAnswer = questionAnswers.find((answer) => answer.question_id == questionId);

      const point = questionAnswerByPoint[questionId];

      totalPoints += parseInt(point, 10);

      return updateQuestionAnswer({ point }, { id: questionAnswer.id });
    });

    updateSubmission({
      id: submissionId,
      total: totalPoints
    }).then((res) => console.log('Updated submission', res));

    snackbar.success();

    await Promise.all(updates);
  }

  onMount(async () => {
    if (!$course.id) {
      const { data } = await fetchCourse(courseId);
      setCourse(data);
    }

    const { data: submissions } = await fetchSubmissions(courseId || $course.id);
    const sectionById = {};

    for (const submission of submissions) {
      const { id, created_at, exercise, course, answers, groupmember, status_id } = submission;
      const isEarly = isSubmissionEarly(created_at, exercise.due_by);

      const submissionItem = {
        id,
        statusId: status_id,
        isEarly,
        submittedAt: formatDate(created_at),
        exercise: {
          id: exercise.id,
          title: exercise.title
        },
        answers,
        student: groupmember && groupmember.profile ? groupmember.profile : {},
        lesson: {
          id: exercise.lesson.id,
          title: exercise.lesson.title
        }
      };

      submissionIdData[id] = {
        id,
        status_id,
        isEarly,
        title: exercise.title,
        student: submissionItem.student,
        questions: exercise.questions,
        answers: formatAnswers({ questions: exercise.questions, answers }),
        questionAnswers: answers,
        questionAnswerByPoint: answers.reduce((acc, answer) => {
          acc[answer.question_id] = answer.point;

          return acc;
        }, {})
      };

      if (Array.isArray(sectionById[status_id])) {
        sectionById[status_id].push(submissionItem);
      } else {
        sectionById[status_id] = [submissionItem];
      }
    }

    sections = sections.map((section, index) => ({
      ...section,
      value: Array.isArray(sectionById[index + 1]) ? sectionById[index + 1].length : 0,
      items: Array.isArray(sectionById[index + 1]) ? sectionById[index + 1] : []
    }));
  });

  $: {
    const query = new URLSearchParams($page.url.search);
    submissionId = query.get('submissionId');
    openExercise = !!submissionId && submissionIdData[submissionId];
  }
</script>

<MarkExerciseModal
  bind:open={openExercise}
  onClose={handleModalClose}
  data={submissionIdData[submissionId] || {}}
  {handleSave}
  {updateStatus}
  {submissionId}
/>

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <CourseContainer>
    <PageNav title="Submitted Exercises" />

    <PageBody width="w-full max-w-6xl md:w-11/12 overflow-x-auto">
      <div class="flex items-center w-full">
        {#each sections as { id, title, items }, idx (id)}
          <div
            class="section rounded-md bg-gray-100 dark:bg-black border border-gray-50 dark:border-neutral-600 p-3 h-80 mr-3 overflow-hidden"
            animate:flip={{ duration: flipDurationMs }}
          >
            <div class="flex items-center mb-2">
              <Chip value={items.length} className="bg-set dark:bg-neutral-800" />
              <p class="dark:text-white ml-2 font-bold">{title}</p>
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
              {#each items as item (item.id)}
                <div
                  class="{item.isEarly
                    ? 'border-none'
                    : 'border border-red-700'} w-full my-2 mx-0 rounded-md bg-white dark:bg-neutral-800 py-3 px-3"
                  animate:flip={{ duration: flipDurationMs }}
                >
                  <a
                    class="flex w-full items-center cursor-pointer text-black mb-2"
                    href={`${$page.url.pathname}?submissionId=${item.id}`}
                  >
                    <img
                      alt="Student avatar"
                      class="block rounded-full h-6 w-6"
                      src={item.student.avatar_url}
                    />
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
                  <!-- <div class="badge rounded-md px-2 bg-green-500 text-white">
                    early
                  </div>
                  <div class="badge rounded-md px-2 bg-red-600 text-white">
                    late
                  </div> -->
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </PageBody>
  </CourseContainer>
</RoleBasedSecurity>

<style>
  .section {
    max-width: 355px;
    min-width: 355px;
    height: 75vh;
  }

  .content {
    height: 95%;
  }
  @media screen and (max-width: 768px) {
    .section {
      min-width: 250px;
    }
  }
</style>
