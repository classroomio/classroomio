<script lang="ts">
  import { page } from '$app/state';
  import { flip } from 'svelte/animate';
  import { goto } from '$app/navigation';
  import { dndzone } from 'svelte-dnd-action';

  import { submissionApi, courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { SubmissionIdData, SubmissionItem, SubmissionSection } from '$features/course/utils/types';

  import { Chip } from '@cio/ui/custom/chip';
  import MarkExerciseModal from '$features/course/components/exercise/mark-exercise-modal.svelte';

  interface Props {
    courseId: string;
    sections: SubmissionSection[];
    submissionIdData: { [key: string]: SubmissionIdData };
  }

  let { courseId, sections: initialSections = [], submissionIdData: initialSubmissionIdData = {} }: Props = $props();

  const flipDurationMs = 300;
  let sections: SubmissionSection[] = $derived(initialSections);
  let submissionIdData: { [key: string]: SubmissionIdData } = $derived(initialSubmissionIdData);
  let isGradeWithAI = $state(false);
  let isSaving = $state(false);

  const submissionId = $derived(new URLSearchParams(page.url.search).get('submissionId') ?? '');
  let openExercise = $derived.by(() => {
    return !!submissionId && !!submissionIdData[submissionId];
  });

  async function handleItemFinalize(
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

      await submissionApi.update(courseId, itemToWithNewStatus.id, {
        statusId: itemToWithNewStatus.statusId
      });
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
  async function updateStatus({
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

      // Update backend
      await submissionApi.update(courseId, itemToWithNewStatus.id, {
        statusId: itemToWithNewStatus.statusId,
        total
      });
    }
  }

  async function handleDeleteSubmission(id: string, statusId: number) {
    const { items } = sections[statusId - 1];

    sections[statusId - 1].items = items?.filter((item) => {
      return item.id === id ? false : true;
    });

    delete submissionIdData[id];

    await submissionApi.delete(courseId, id);

    if (submissionApi.success) {
      snackbar.success('course.navItem.submissions.grading_modal.delete_success');
    } else {
      snackbar.error('course.navItem.submissions.grading_modal.delete_error');
      return;
    }

    handleModalClose();
  }

  async function handleSave(submission: { questionAnswerByPoint: any; questionAnswers: any; feedback: any }) {
    isSaving = true;
    const { questionAnswerByPoint, questionAnswers, feedback } = submission;

    let totalPoints = 0;

    for (const questionId in questionAnswerByPoint) {
      if (Object.prototype.hasOwnProperty.call(questionAnswerByPoint, questionId)) {
        const questionAnswer = questionAnswers.find(
          (answer: { questionId: string }) => answer.questionId == questionId
        );
        const point = questionAnswerByPoint[questionId];

        totalPoints += parseInt(point, 10);

        await submissionApi.updateAnswer(courseId, submissionId, {
          questionId: Number(questionId),
          points: Number(point),
          answer: questionAnswer?.answer
        });

        if (!submissionApi.success) {
          snackbar.error(`snackbar.something`);
          return;
        }
      }
    }

    await submissionApi.update(courseId, submissionId, {
      total: totalPoints,
      feedback: feedback
    });

    snackbar.success('snackbar.submissions.success.grading');

    isSaving = false;
  }
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

<div class="flex items-center overflow-x-scroll">
  {#each sections as { id, title, items }, idx (id)}
    <div
      class="section ui:bg-muted mr-3 h-80 overflow-hidden rounded-md p-3"
      animate:flip={{ duration: flipDurationMs }}
    >
      <div class="mb-2 flex items-center">
        <Chip value={items.length} />
        <p class="ml-2 dark:text-white">{title}</p>
      </div>
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
            <a class="ui:text-primary text-md" href="{page.url.pathname}?submissionId={item.id}">
              {item.exercise.title}
            </a>
            <a
              class="my-2 flex items-center text-black no-underline hover:underline"
              href={`/courses/${courseApi.course?.id}/exercises/${item.exercise.id}`}
            >
              <p class="text-grey text-sm dark:text-white">{item.exercise.title}</p>
            </a>
            {#if item.lesson}
              <p class="text-grey text-sm dark:text-white">#{item.lesson.title}</p>
            {/if}
            <p class="text-xs text-gray-500 dark:text-white">
              {item.submittedAt}
            </p>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

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
