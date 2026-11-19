<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { flip } from 'svelte/animate';
  import { goto } from '$app/navigation';
  import { dndzone } from 'svelte-dnd-action';
  import { SvelteSet } from 'svelte/reactivity';
  import { onMount, untrack } from 'svelte';

  import { submissionApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { SubmissionIdData, SubmissionItem, SubmissionSection } from '$features/course/utils/types';
  import {
    formatIdParam,
    matchesBoardFilters,
    mergeColumnItems,
    parseIdParam,
    sameIdSelection,
    type SubmissionFilterOption
  } from '$features/course/utils/submission-board-filters';
  import { t } from '$lib/utils/functions/translations';

  import { Chip } from '@cio/ui/custom/chip';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import MarkExerciseModal from '$features/course/components/exercise/mark-exercise-modal.svelte';
  import SubmissionFilterBar from '$features/course/components/submissions/submission-filter-bar.svelte';
  import { STATUS } from '$features/course/components/exercise/constants';

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
  let selectedStudentIds = new SvelteSet<string>(parseIdParam(page.url.searchParams.get('students')));
  let selectedExerciseIds = new SvelteSet<string>(parseIdParam(page.url.searchParams.get('exercises')));

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
  let openExercise = $state(false);

  $effect(() => {
    const id = submissionId;
    openExercise = Boolean(id && submissionIdData[id]);
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

  async function handleItemFinalize(columnIdx: number, nextVisibleItems: SubmissionItem[]) {
    let itemToWithNewStatus: SubmissionItem | undefined;

    const { id } = sections[columnIdx];
    const mergedItems = mergeColumnItems(sections[columnIdx].items, nextVisibleItems, matchesBoardItem);

    const mappedItems = mergedItems.map((item) => {
      if (item.statusId === id) return item;

      if (!canTransitionBoardStatus(item.statusId, id)) {
        snackbar.error('course.navItem.submissions.workflow.invalid_transition');
        return item;
      }

      itemToWithNewStatus = item;
      return { ...item, statusId: id };
    });

    sections = sections.map((section, index) => (index === columnIdx ? { ...section, items: mappedItems } : section));

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
    return function (event: { detail: { items: SubmissionItem[] } }) {
      const nextVisibleItems = event.detail.items;
      sections = sections.map((section, index) => {
        if (index !== columnIdx) return section;

        const items = mergeColumnItems(section.items, nextVisibleItems, matchesBoardItem);
        return { ...section, items };
      });
    };
  }

  function handleDndFinalizeCards(columnIdx: number) {
    return (event: { detail: { items: SubmissionItem[] } }) => handleItemFinalize(columnIdx, event.detail.items);
  }

  function studentDisplayName(student: SubmissionItem['student']): string {
    if (!student) return '';

    const fullname = typeof student.fullname === 'string' ? student.fullname.trim() : '';
    const username = typeof student.username === 'string' ? student.username.trim() : '';
    return fullname || username;
  }

  function matchesBoardItem(item: SubmissionItem): boolean {
    const studentId = item.student?.id ? String(item.student.id) : '';
    const exerciseId = item.exercise?.id ? String(item.exercise.id) : '';
    return matchesBoardFilters({ studentId, exerciseId }, selectedStudentIds, selectedExerciseIds);
  }

  function countOptions(
    readOption: (item: SubmissionItem) => { id: string; label: string } | null
  ): SubmissionFilterOption[] {
    const counts: Record<string, { label: string; count: number }> = {};

    for (const section of sections) {
      for (const item of section.items) {
        const option = readOption(item);
        if (!option) continue;

        const current = counts[option.id];
        if (current) {
          current.count += 1;
          continue;
        }

        counts[option.id] = { label: option.label, count: 1 };
      }
    }

    return Object.entries(counts)
      .map(([id, value]) => ({ id, label: value.label, count: value.count }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  const visibleSections = $derived(
    sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => matchesBoardItem(item))
    }))
  );
  const totalCount = $derived(sections.reduce((sum, section) => sum + section.items.length, 0));
  const visibleCount = $derived(visibleSections.reduce((sum, section) => sum + section.items.length, 0));
  const selectedStudentIdList = $derived([...selectedStudentIds]);
  const selectedExerciseIdList = $derived([...selectedExerciseIds]);
  const firstVisibleCardId = $derived(visibleSections.find((section) => section.items.length > 0)?.items[0]?.id ?? '');
  const studentOptions = $derived(
    countOptions((item) => {
      const studentId = item.student?.id ? String(item.student.id) : '';
      if (!studentId) return null;

      const displayName = studentDisplayName(item.student);
      const unknownStudentLabel = $t('course.navItem.submissions.filter.unknown_student');
      const label = displayName || unknownStudentLabel;

      return { id: studentId, label };
    })
  );
  const exerciseOptions = $derived(
    countOptions((item) => {
      const exerciseId = item.exercise?.id ? String(item.exercise.id) : '';
      if (!exerciseId) return null;

      return { id: exerciseId, label: item.exercise.title };
    })
  );

  function replaceSelectedIds(target: SvelteSet<string>, ids: string[]) {
    target.clear();
    for (const id of ids) target.add(id);
  }

  function resetFilters() {
    selectedStudentIds.clear();
    selectedExerciseIds.clear();
  }

  function gradingHref(submissionItemId: string): string {
    const url = new URL(page.url);
    url.searchParams.set('submissionId', submissionItemId);
    return `${url.pathname}${url.search}`;
  }

  $effect(() => {
    if (!browser) return;

    const studentsParam = page.url.searchParams.get('students');
    const exercisesParam = page.url.searchParams.get('exercises');

    untrack(() => {
      if (!sameIdSelection(selectedStudentIds, studentsParam)) {
        replaceSelectedIds(selectedStudentIds, parseIdParam(studentsParam));
      }

      if (!sameIdSelection(selectedExerciseIds, exercisesParam)) {
        replaceSelectedIds(selectedExerciseIds, parseIdParam(exercisesParam));
      }
    });
  });

  $effect(() => {
    if (!browser) return;

    const studentsMatch = sameIdSelection(selectedStudentIds, page.url.searchParams.get('students'));
    const exercisesMatch = sameIdSelection(selectedExerciseIds, page.url.searchParams.get('exercises'));
    if (studentsMatch && exercisesMatch) return;

    untrack(() => {
      const url = new URL(page.url);
      const students = formatIdParam(selectedStudentIds);
      const exercises = formatIdParam(selectedExerciseIds);

      if (students) url.searchParams.set('students', students);
      else url.searchParams.delete('students');

      if (exercises) url.searchParams.set('exercises', exercises);
      else url.searchParams.delete('exercises');

      goto(`${url.pathname}${url.search}`, {
        replaceState: true,
        keepFocus: true,
        noScroll: true
      });
    });
  });

  function handleModalClose() {
    isGradeWithAI = false;
    const url = new URL(page.url);
    url.searchParams.delete('submissionId');
    goto(`${url.pathname}${url.search}`);
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
      feedback: feedback || undefined,
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

    handleModalClose();

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

<SubmissionFilterBar
  {studentOptions}
  {exerciseOptions}
  selectedStudentIds={selectedStudentIdList}
  selectedExerciseIds={selectedExerciseIdList}
  {visibleCount}
  {totalCount}
  onStudentIdsChange={(ids) => replaceSelectedIds(selectedStudentIds, ids)}
  onExerciseIdsChange={(ids) => replaceSelectedIds(selectedExerciseIds, ids)}
  onReset={resetFilters}
/>

<div class="flex items-center overflow-x-scroll">
  {#each visibleSections as { id, title, items }, idx (id)}
    <div
      class="section ui:bg-muted ui:border-border mr-3 h-80 overflow-hidden rounded-md border p-3"
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
              ? 'ui:border-border'
              : 'border-red-700'} ui:bg-card mx-0 my-2 w-full rounded-md border px-3 py-3 shadow-sm"
            animate:flip={{ duration: flipDurationMs }}
            data-testid={item.id === firstVisibleCardId ? 'submissions-board-card' : undefined}
          >
            <div class="mb-2 flex w-full items-center">
              <UserAvatar
                src={item.student?.avatarUrl}
                alt={$t('course.navItem.submissions.grading_modal.student_avatar')}
                class="h-6 w-6"
              />
              <p class="ml-2 text-sm dark:text-white">
                {studentDisplayName(item.student)}
              </p>
            </div>
            <a class="ui:text-primary text-md" href={gradingHref(item.id)}>
              {item.exercise.title}
            </a>
            {#if item.lesson}
              <p class="ui:text-muted-foreground my-2 text-sm">#{item.lesson.title}</p>
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
