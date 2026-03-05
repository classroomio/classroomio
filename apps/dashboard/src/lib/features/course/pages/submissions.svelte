<script lang="ts">
  import { page } from '$app/state';
  import { flip } from 'svelte/animate';
  import { goto } from '$app/navigation';
  import { dndzone } from 'svelte-dnd-action';

  import { submissionApi, courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { SubmissionIdData, SubmissionItem, SubmissionSection } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  import { Chip } from '@cio/ui/custom/chip';
  import MarkExerciseModal from '$features/course/components/exercise/mark-exercise-modal.svelte';
  import { STATUS } from '$features/course/components/exercise/constants';
  import { onMount } from 'svelte';

  interface Props {
    courseId: string;
    sections: SubmissionSection[];
    submissionIdData: { [key: string]: SubmissionIdData };
  }

  let { courseId, sections: initialSections = [], submissionIdData: initialSubmissionIdData = {} }: Props = $props();

  const flipDurationMs = 300;
  let sections = $state<SubmissionSection[]>([]);
  let submissionIdData = $state<Record<string, SubmissionIdData>>({});
  let isGradeWithAI = $state(false);
  let isSaving = $state(false);

  onMount(() => {
    sections = initialSections;
    submissionIdData = { ...initialSubmissionIdData };
  });

  const ALLOWED_BOARD_TRANSITIONS: Record<number, number[]> = {
    1: [2],
    2: [1, 3],
    3: []
  };

  const submissionId = $derived(new URLSearchParams(page.url.search).get('submissionId') ?? '');
  let openExercise = $derived.by(() => {
    return !!submissionId && !!submissionIdData[submissionId];
  });

  function canTransitionBoardStatus(previousStatusId: number, nextStatusId: number): boolean {
    if (previousStatusId === nextStatusId) return true;
    return ALLOWED_BOARD_TRANSITIONS[previousStatusId]?.includes(nextStatusId) ?? false;
  }

  function getWorkflowHintKey(item: SubmissionItem): string {
    if (item.statusId !== 2) return '';
    if (item.gradingState === 'awaiting_manual') return 'course.navItem.submissions.workflow.awaiting_manual_hint';
    if (item.gradingState === 'failed') return 'course.navItem.submissions.workflow.failed_hint';
    return '';
  }

  async function handleItemFinalize(
    columnIdx: number,
    newItems: { map: (arg0: (item: SubmissionItem) => SubmissionItem) => SubmissionItem[] }
  ) {
    let itemToWithNewStatus: SubmissionItem | undefined;

    const { id } = sections[columnIdx];

    // Set column in the UI (immutable update for reactivity)
    const mappedItems = newItems.map((item) => {
      if (item.statusId !== id) {
        if (!canTransitionBoardStatus(item.statusId, id)) {
          snackbar.error('course.navItem.submissions.workflow.invalid_transition');
          return item;
        }

        itemToWithNewStatus = item;
        return { ...item, statusId: id };
      }

      return item;
    });

    sections = sections.map((section, i) => (i === columnIdx ? { ...section, items: mappedItems } : section));

    // Update backend
    if (itemToWithNewStatus) {
      const newStatusId = id;
      submissionIdData = {
        ...submissionIdData,
        [itemToWithNewStatus.id]: {
          ...submissionIdData[itemToWithNewStatus.id],
          statusId: newStatusId
        }
      };

      await submissionApi.update(courseId, itemToWithNewStatus.id, {
        statusId: newStatusId
      });
    }
  }

  function handleDndConsiderCards(columnIdx: number) {
    return function (e) {
      sections = sections.map((section, i) => (i === columnIdx ? { ...section, items: e.detail.items } : section));
    };
  }

  function handleDndFinalizeCards(columnIdx: number) {
    return (e) => handleItemFinalize(columnIdx, e.detail.items);
  }

  function handleModalClose() {
    isGradeWithAI = false;
    goto(page.url.pathname);
  }

  async function handleDeleteSubmission(id: string, statusId: number) {
    const sectionIdx = statusId - 1;
    sections = sections.map((section, i) =>
      i === sectionIdx ? { ...section, items: section.items.filter((item) => item.id !== id) } : section
    );

    const { [id]: _, ...rest } = submissionIdData;
    submissionIdData = rest;

    await submissionApi.delete(courseId, id);

    if (submissionApi.success) {
      snackbar.success('course.navItem.submissions.grading_modal.delete_success');
    } else {
      snackbar.error('course.navItem.submissions.grading_modal.delete_error');
      return;
    }

    handleModalClose();
  }

  async function handleSave(submission: {
    id?: string;
    questionAnswerByPoint: Record<string, string | number>;
    feedback?: string;
  }) {
    isSaving = true;
    const { questionAnswerByPoint, feedback } = submission;
    const subId = submission.id ?? submissionId;

    const answers = Object.entries(questionAnswerByPoint ?? {}).map(([questionId, point]) => ({
      questionId: Number(questionId),
      points: Number(point)
    }));
    const total = answers.reduce((sum, { points }) => sum + points, 0);

    await submissionApi.updateGrades(courseId, subId, {
      answers,
      total,
      feedback,
      statusId: STATUS.GRADED
    });

    if (!submissionApi.success) {
      snackbar.error('snackbar.something');
      isSaving = false;
      return;
    }

    // Backend auto-sets status to Graded; move card to Graded column and sync submissionIdData
    const gradedStatusId = STATUS.GRADED;
    const prevSection = sections.find((s) => s.items.some((item) => item.id === subId));
    const prevStatusId = prevSection?.id ?? gradedStatusId;

    if (prevStatusId !== gradedStatusId) {
      const prevIdx = prevStatusId - 1;
      const nextIdx = gradedStatusId - 1;
      const prevItems = sections[prevIdx]?.items ?? [];
      const found = prevItems.find((item) => item.id === subId);
      const itemToWithNewStatus = found ? { ...found, statusId: gradedStatusId } : undefined;

      sections = sections.map((section, i) => {
        if (i === prevIdx) {
          return { ...section, items: prevItems.filter((item) => item.id !== subId) };
        }
        if (i === nextIdx && itemToWithNewStatus) {
          return { ...section, items: [...section.items, itemToWithNewStatus] };
        }
        return section;
      });
    }

    submissionIdData = {
      ...submissionIdData,
      [subId]: {
        ...submissionIdData[subId],
        statusId: gradedStatusId,
        questionAnswerByPoint: submission.questionAnswerByPoint ?? submissionIdData[subId]?.questionAnswerByPoint,
        feedback: feedback ?? submissionIdData[subId]?.feedback
      }
    };

    isSaving = false;
  }
</script>

<MarkExerciseModal
  bind:open={openExercise}
  onClose={handleModalClose}
  data={submissionIdData[submissionId] || {}}
  {handleSave}
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
              <img alt="Student avatar" class="block h-6 w-6 rounded-full" src={item.student.avatarUrl} />
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
            {#if getWorkflowHintKey(item)}
              <p class="ui:text-muted-foreground text-xs">
                {$t(getWorkflowHintKey(item))}
              </p>
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
