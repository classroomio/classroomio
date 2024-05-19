<script lang="ts">
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
  import { course } from '$lib/components/Course/store';
  import {
    fetchSubmissions,
    updateSubmission,
    updateQuestionAnswer
  } from '$lib/utils/services/submissions/index';
  import { formatAnswers } from '$lib/components/Course/function';
  import { snackbar } from '$lib/components/Snackbar/store';
  import isSubmissionEarly from '$lib/utils/functions/isSubmissionEarly';
  import formatDate from '$lib/utils/functions/formatDate';
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations.js';

  type items = {
    id: number;
    statusId: number;
    isEarly: boolean;
    submittedAt: string;
    exercise: {
      id: string;
      title: string;
    };
    answers: string;
    student: any;
    lesson: {
      id: string | any;
      title: string | any;
    };
  };
  type sectionType = {
    id: number;
    title: string;
    value: number;
    items: items[] | [];
  };

  export let data;
  const { courseId } = data;

  const flipDurationMs = 300;
  let exerciseDetails: { id: string; title: string };
  let lessonDetails: { id: string; title: string };
  let totalMark = 0;
  let maxMark = 0;
  let submissionIdData: { [key: number]: any } = {};
  let submissionId: string | number | null;
  let openExercise = false;
  let isGradeWithAI = false;

  const submissionStatus: { [key: number]: string } = {
    1: $t('course.navItem.submissions.submission_status.submitted'),
    2: $t('course.navItem.submissions.submission_status.in_progress'),
    3: $t('course.navItem.submissions.submission_status.graded')
  };

  let sections: sectionType[] = [
    {
      id: 1,
      title: $t('course.navItem.submissions.submission_status.submitted'),
      value: 0,
      items: []
    },
    {
      id: 2,
      title: $t('course.navItem.submissions.submission_status.in_progress'),
      value: 0,
      items: []
    },
    {
      id: 3,
      title: $t('course.navItem.submissions.submission_status.graded'),
      value: 10,
      items: []
    }
  ];

  function getMaxPoints(questions) {
    return (questions || []).reduce((acc, question) => acc + question.points, 0);
  }

  function calculateTotal(grades: string[]): number {
    if (!grades) return 0;
    return Object.values(grades).reduce((acc, grade) => acc + parseInt(grade), 0);
  }

  const notifyStudent = (submissionData) => {
    maxMark = getMaxPoints(submissionData?.questions);
    totalMark = calculateTotal(submissionData?.questionAnswerByPoint);

    const { fullname, email } = submissionData?.student;
    const { title, status_id }: { title: string; status_id: number } = submissionData;
    const exerciseLink = `${$currentOrgDomain}/courses/${courseId}/lessons/${lessonDetails.id}/exercises/${exerciseDetails.id}`;

    const content = `
      <p>Hello ${fullname},</p>
        <p>The status of your submitted exercise on <strong>${title}</strong> has been updated to ${
          submissionStatus[status_id]
        }</p>
        ${
          status_id == 3
            ? `<p>Your score was ${totalMark}/${maxMark}</p>
              <a class="button" href="${exerciseLink}">View your Result</a>
            `
            : `<a class="button" href="${exerciseLink}">Open Exercise</a>`
        }
        <p>This exercise is for <strong>${
          lessonDetails.title
        }</strong> in a course you are taking titled <strong>${$course.title}</strong></p>
      `;

    triggerSendEmail(NOTIFICATION_NAME.SUBMISSION_UPDATE, {
      to: email,
      content,
      orgName: $currentOrg?.name
    });
  };

  function handleItemFinalize(
    columnIdx: number,
    newItems: { map: (arg0: (item: items) => items) => items[] }
  ) {
    let itemToWithNewStatus: items | undefined;

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

      notifyStudent(submissionIdData[itemToWithNewStatus.id]);

      updateSubmission({
        id: itemToWithNewStatus.id,
        status_id: itemToWithNewStatus.statusId
      }).then((res) => console.log('Updated submission', res));
    }
  }

  function handleDndConsiderCards(columnIdx: number) {
    return function (e) {
      sections[columnIdx].items = e.detail.items;
    };
  }

  function handleDndFinalizeCards(columnIdx: number) {
    return (e) => handleItemFinalize(columnIdx, e.detail.items);
  }

  function handleModalClose() {
    isGradeWithAI = false;
    goto($page.url.pathname);
  }

  // Via dialog
  function updateStatus({
    submissionId,
    prevStatusId,
    nextStatusId,
    total
  }: {
    submissionId: number;
    prevStatusId: number;
    nextStatusId: number;
    total: number;
  }) {
    let itemToWithNewStatus: items | undefined;

    // Remove from current column
    const { items } = sections[prevStatusId - 1];
    sections[prevStatusId - 1].items = items?.filter((item) => {
      if (item.id === submissionId) {
        itemToWithNewStatus = Object.assign(item);
        if (itemToWithNewStatus) {
          itemToWithNewStatus.statusId = nextStatusId;
        }
        return false;
      }

      return true;
    });
    console.log(`itemToWithNewStatus`, itemToWithNewStatus);
    // Move to right column
    if (itemToWithNewStatus) {
      sections[nextStatusId - 1].items = [...sections[nextStatusId - 1].items, itemToWithNewStatus];
    }

    // If something changed
    if (itemToWithNewStatus) {
      // Update key mapping for each submission also
      submissionIdData[itemToWithNewStatus.id] = {
        ...submissionIdData[itemToWithNewStatus.id],
        status_id: itemToWithNewStatus.statusId
      };

      notifyStudent(submissionIdData[itemToWithNewStatus.id]);
      // Update backend
      updateSubmission({
        id: itemToWithNewStatus.id,
        status_id: itemToWithNewStatus.statusId,
        total
      }).then((res) => console.log('Updated submission', res));
    }
  }

  async function handleSave(submission: {
    questionAnswerByPoint: any;
    questionAnswers: any;
    feedback: any;
  }) {
    const { questionAnswerByPoint, questionAnswers, feedback } = submission;

    let totalPoints = 0;

    const updates = Object.keys(questionAnswerByPoint).map((questionId) => {
      const questionAnswer = questionAnswers.find(
        (answer: { question_id: string }) => answer.question_id == questionId
      );

      const point = questionAnswerByPoint[questionId];

      totalPoints += parseInt(point, 10);

      return updateQuestionAnswer({ point }, { id: questionAnswer?.id });
    });

    updateSubmission({
      id: submissionId,
      total: totalPoints,
      feedback: feedback
    }).then((res) => console.log('Updated submission', res));

    snackbar.success('snackbar.submissions.success.grading');

    await Promise.all(updates);
  }

  $: {
    const query = new URLSearchParams($page.url.search);
    submissionId = query.get('submissionId');
    openExercise = !!submissionId && submissionIdData[submissionId];
  }

  async function firstRender(courseId: string) {
    const { data: submissions } = await fetchSubmissions(courseId);
    const sectionById: { [key: number]: sectionType[] } = {};
    if (submissions) {
      for (const submission of submissions) {
        const { id, created_at, exercise, course, answers, groupmember, status_id, feedback } =
          submission;

        const isEarly = isSubmissionEarly(created_at, exercise.due_by);

        const submissionItem = {
          id,
          statusId: status_id,
          isEarly,
          feedback,
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
        exerciseDetails = { id: submissionItem.exercise.id, title: submissionItem.exercise.title };
        lessonDetails = {
          id: submissionItem.lesson.id,
          title: submissionItem.lesson.title
        };
        submissionIdData[id] = {
          id,
          status_id,
          feedback,
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
    }

    sections = sections.map((section, index) => ({
      ...section,
      value: Array.isArray(sectionById[index + 1]) ? sectionById[index + 1].length : 0,
      items: Array.isArray(sectionById[index + 1]) ? sectionById[index + 1] : []
    }));
  }

  $: browser && $course.id && firstRender($course.id);
</script>

<MarkExerciseModal
  bind:open={openExercise}
  onClose={handleModalClose}
  data={submissionIdData[submissionId] || {}}
  {handleSave}
  {updateStatus}
  {submissionId}
  bind:isGradeWithAI
/>

<CourseContainer bind:courseId={data.courseId}>
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <PageNav title={$t('course.navItem.submissions.title')} />

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
  </RoleBasedSecurity>
</CourseContainer>

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
