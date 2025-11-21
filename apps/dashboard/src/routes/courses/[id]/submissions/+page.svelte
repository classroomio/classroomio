<script lang="ts">
  import { page } from '$app/state';
  import { flip } from 'svelte/animate';
  import { goto } from '$app/navigation';
  import { dndzone } from 'svelte-dnd-action';

  import {
    deleteSubmission,
    fetchSubmissions,
    updateQuestionAnswer,
    updateSubmission
  } from '$lib/utils/services/submissions';
  import { course } from '$lib/components/Course/store';
  import { t } from '$lib/utils/functions/translations';
  import formatDate from '$lib/utils/functions/formatDate';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { formatAnswers } from '$lib/components/Course/function.js';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import isSubmissionEarly from '$lib/utils/functions/isSubmissionEarly';
  import { NOTIFICATION_NAME, triggerSendEmail } from '$lib/utils/services/notification/notification';
  import type { SubmissionIdData, SubmissionItem, SubmissionSection } from '$lib/utils/types/submission';

  import { Skeleton } from '@cio/ui/base/skeleton';
  import Chip from '$lib/components/Chip/index.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import MarkExerciseModal from '$lib/components/Course/components/Lesson/Exercise/MarkExerciseModal.svelte';

  let { data = $bindable() } = $props();
  const { courseId } = data;

  const flipDurationMs = 300;
  let exerciseDetails: { id: string; title: string };
  let lessonDetails: { id: string; title: string };
  let totalMark = 0;
  let maxMark = 0;
  let submissionIdData: { [key: number]: SubmissionIdData } = $state({});
  let isGradeWithAI = $state(false);
  let fetching = $state(false);
  let isSaving = $state(false);
  let hasFetched = $state(false);

  const submissionId = $derived(new URLSearchParams(page.url.search).get('submissionId') ?? '');
  let openExercise = $derived.by(() => {
    return !!submissionId && !!submissionIdData[submissionId];
  });

  const submissionStatus: { [key: number]: string } = {
    1: $t('course.navItem.submissions.submission_status.submitted'),
    2: $t('course.navItem.submissions.submission_status.in_progress'),
    3: $t('course.navItem.submissions.submission_status.graded')
  };

  let sections: SubmissionSection[] = $state([
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
  ]);

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
    const { title, statusId }: { title: string; statusId: number } = submissionData;
    const exerciseLink = `${$currentOrgDomain}/courses/${courseId}/lessons/${lessonDetails.id}/exercises/${exerciseDetails.id}`;

    const content = `
      <p>Hello ${fullname},</p>
        <p>The status of your submitted exercise on <strong>${title}</strong> has been updated to ${
          submissionStatus[statusId]
        }</p>
        ${
          statusId == 3
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
    newItems: { map: (arg0: (item: SubmissionItem) => SubmissionItem) => SubmissionItem[] }
  ) {
    let itemToWithNewStatus: SubmissionItem | undefined;

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
        statusId: itemToWithNewStatus.statusId
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
    goto(page.url.pathname);
  }

  // Via dialog
  function updateStatus({
    submissionId,
    prevStatusId,
    nextStatusId,
    total
  }: {
    submissionId: string;
    prevStatusId: number;
    nextStatusId: number;
    total: number;
  }) {
    let itemToWithNewStatus: SubmissionItem | undefined;

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
    // Move to right column
    if (itemToWithNewStatus) {
      sections[nextStatusId - 1].items = [...sections[nextStatusId - 1].items, itemToWithNewStatus];
    }

    // If something changed
    if (itemToWithNewStatus) {
      // Update key mapping for each submission also
      submissionIdData[itemToWithNewStatus.id] = {
        ...submissionIdData[itemToWithNewStatus.id],
        statusId: itemToWithNewStatus.statusId
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

  async function handleDeleteSubmission(id: string, statusId: number) {
    const { items } = sections[statusId - 1];

    sections[statusId - 1].items = items?.filter((item) => {
      return item.id === id ? false : true;
    });

    submissionIdData[id] = undefined;

    const { error } = await deleteSubmission(id);

    if (error) {
      console.error('Error deleting submission', error);
      snackbar.error('course.navItem.submissions.grading_modal.delete_error');
      return;
    }

    snackbar.success('course.navItem.submissions.grading_modal.delete_success');

    handleModalClose();
  }

  async function handleSave(submission: { questionAnswerByPoint: any; questionAnswers: any; feedback: any }) {
    isSaving = true;
    const { questionAnswerByPoint, questionAnswers, feedback } = submission;

    let totalPoints = 0;

    for (const questionId in questionAnswerByPoint) {
      if (Object.prototype.hasOwnProperty.call(questionAnswerByPoint, questionId)) {
        const questionAnswer = questionAnswers.find(
          (answer: { question_id: string }) => answer.question_id == questionId
        );
        const point = questionAnswerByPoint[questionId];

        totalPoints += parseInt(point, 10);

        const qaResponse = await updateQuestionAnswer({ point }, { id: questionAnswer?.id });

        if (qaResponse.error) {
          console.error('Error saving', qaResponse.error);
          snackbar.error(`snackbar.something`);

          return;
        }
      }
    }

    await updateSubmission({
      id: submissionId,
      total: totalPoints,
      feedback: feedback
    });

    snackbar.success('snackbar.submissions.success.grading');

    isSaving = false;
  }

  async function firstRender(courseId?: string) {
    if (!courseId || hasFetched) return;

    hasFetched = true;

    fetching = true;
    const { data: submissions } = await fetchSubmissions(courseId);
    const sectionById: { [key: number]: SubmissionSection[] } = {};

    if (submissions) {
      for (const submission of submissions) {
        const { id, created_at, answers, groupmember, feedback, exercise } = submission;

        const isEarly = isSubmissionEarly(created_at, exercise.due_by);

        const submissionItem = {
          id,
          statusId: submission.status_id,
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
          statusId: submissionItem.statusId,
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

        if (Array.isArray(sectionById[submission.status_id])) {
          sectionById[submission.status_id].push(submissionItem);
        } else {
          sectionById[submission.status_id] = [submissionItem];
        }
      }
    }

    sections = sections.map((section, index) => ({
      ...section,
      value: Array.isArray(sectionById[index + 1]) ? sectionById[index + 1].length : 0,
      items: Array.isArray(sectionById[index + 1]) ? sectionById[index + 1] : []
    }));

    fetching = false;
  }

  $effect(() => {
    firstRender($course.id);
  });
</script>

<MarkExerciseModal
  bind:open={openExercise}
  onClose={handleModalClose}
  data={submissionIdData[submissionId] || {}}
  {handleSave}
  {updateStatus}
  deleteSubmission={handleDeleteSubmission}
  bind:isGradeWithAI
  {isSaving}
/>

<CourseContainer courseId={data.courseId}>
  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <PageNav title={$t('course.navItem.submissions.title')} />

    <PageBody width="w-full max-w-6xl md:w-11/12 overflow-x-auto">
      <div class="flex w-full items-center">
        {#each sections as { id, title, items }, idx (id)}
          <div
            class="section mr-3 h-80 overflow-hidden rounded-md border border-gray-50 bg-gray-100 p-3 dark:border-neutral-600 dark:bg-black"
            animate:flip={{ duration: flipDurationMs }}
          >
            <div class="mb-2 flex items-center">
              <Chip value={items.length} className="bg-set dark:bg-neutral-800" />
              <p class="ml-2 dark:text-white">{title}</p>
            </div>
            {#if fetching}
              <Skeleton class="my-2 h-[170px] w-full rounded-md" />
              <Skeleton class="my-2 h-[170px] w-full rounded-md" />
              <Skeleton class="my-2 h-[170px] w-full rounded-md" />
            {:else}
              <div
                class="content mb-3 overflow-y-auto pr-2"
                use:dndzone={{
                  items,
                  flipDurationMs,
                  dropTargetStyle: { outline: 'blue' }
                }}
                onconsider={handleDndConsiderCards(idx)}
                onfinalize={handleDndFinalizeCards(idx)}
              >
                {#each items as item (item.id)}
                  <div
                    class="{item.isEarly
                      ? 'border-none'
                      : 'border border-red-700'} mx-0 my-2 w-full rounded-md bg-white px-3 py-3 dark:bg-neutral-800"
                    animate:flip={{ duration: flipDurationMs }}
                  >
                    <a
                      class="mb-2 flex w-full cursor-pointer items-center text-black"
                      href={`${page.url.pathname}?submissionId=${item.id}`}
                    >
                      <img alt="Student avatar" class="block h-6 w-6 rounded-full" src={item.student.avatar_url} />
                      <p class="ml-2 text-sm dark:text-white">
                        {item.student.username}
                      </p>
                    </a>
                    <a class="text-primary-700 text-md" href="{page.url.pathname}?submissionId={item.id}">
                      {item.exercise.title}
                    </a>
                    <a
                      class="my-2 flex items-center text-black no-underline hover:underline"
                      href="{page.url?.pathname?.replace('submissions', 'lessons')}/{item.lesson.id}/exercises/{item
                        .exercise.id}"
                    >
                      <p class="text-grey text-sm dark:text-white">
                        #{item.lesson.title}
                      </p>
                    </a>
                    <p class="text-xs text-gray-500 dark:text-white">
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
            {/if}
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
