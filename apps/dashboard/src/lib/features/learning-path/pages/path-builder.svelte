<script lang="ts">
  import { DeleteModal } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { Empty } from '@cio/ui/custom/empty';
  import BookIcon from '@lucide/svelte/icons/book';
  import { dndzone } from 'svelte-dnd-action';
  import { learningPathApi } from '../api';
  import { AddCourseToPathModal, CourseRow, UnlockToggle } from '../components';
  import type { LearningPathCourseItem, LearningPathDetail } from '../utils/types';
  import { LearningEntityIcon } from '$features/ui';

  interface Props {
    path: LearningPathDetail;
    reorder?: boolean;
    showAddDialog?: boolean;
  }

  let { path, reorder = $bindable(false), showAddDialog = $bindable(false) }: Props = $props();

  let courseItems = $state<LearningPathCourseItem[]>([]);
  let courseToRemove = $state<LearningPathCourseItem | null>(null);
  let showDeleteModal = $state(false);
  let isRemoving = $state(false);
  let isUpdatingUnlock = $state(false);

  $effect(() => {
    if (path && path.courses) {
      courseItems = [...path.courses];
    }
  });

  const existingCourseIds = $derived(courseItems.map((c) => c.courseId));

  const totalCourses = $derived(courseItems.length);
  const totalLessons = $derived(courseItems.reduce((acc, c) => acc + (c.lessonsCount || 0), 0));
  const totalExercises = $derived(courseItems.reduce((acc, c) => acc + (c.exercisesCount || 0), 0));

  function handleDndConsider(e: CustomEvent<{ items: LearningPathCourseItem[] }>) {
    courseItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<{ items: LearningPathCourseItem[] }>) {
    const updated = e.detail.items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    courseItems = updated;
    path.courses = updated;
  }

  async function handleUnlockToggle(nextChecked: boolean) {
    if (isUpdatingUnlock) return;

    isUpdatingUnlock = true;
    try {
      await learningPathApi.update(path.id, { sequentialUnlock: nextChecked });
    } finally {
      isUpdatingUnlock = false;
    }
  }

  function handleOpenRemoveDialog(course: LearningPathCourseItem) {
    courseToRemove = course;
    showDeleteModal = true;
  }

  async function handleConfirmRemove() {
    if (!courseToRemove) return;

    isRemoving = true;
    try {
      await learningPathApi.removeCourse(path.id, courseToRemove.courseId);
      showDeleteModal = false;
      courseToRemove = null;
    } finally {
      isRemoving = false;
    }
  }
</script>

<DeleteModal bind:open={showDeleteModal} onDelete={handleConfirmRemove} isLoading={isRemoving} />

<div class="w-full pb-12">
  <!-- Stats row matching Course lessons.svelte -->
  {#if courseItems.length > 0}
    <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="ui:border-border flex flex-col gap-1 rounded-lg border px-4 py-3">
        <div class="ui:text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <LearningEntityIcon type="course" size={14} />
          <span>{$t('learningPath.workspace.tabs.courses')}</span>
        </div>
        <p class="text-2xl font-semibold tabular-nums">{totalCourses}</p>
      </div>
      <div class="ui:border-border flex flex-col gap-1 rounded-lg border px-4 py-3">
        <div class="ui:text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <LearningEntityIcon type="lesson" size={14} />
          <span>{$t('course.navItem.lessons.stats.lessons')}</span>
        </div>
        <p class="text-2xl font-semibold tabular-nums">{totalLessons}</p>
      </div>
      <div class="ui:border-border flex flex-col gap-1 rounded-lg border px-4 py-3">
        <div class="ui:text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <LearningEntityIcon type="exercise" size={14} />
          <span>{$t('course.navItem.lessons.stats.exercises')}</span>
        </div>
        <p class="text-2xl font-semibold tabular-nums">{totalExercises}</p>
      </div>
    </div>
  {/if}

  {#if courseItems.length > 0}
    <!-- Unlock in order toggle rule -->
    <UnlockToggle checked={path.sequentialUnlock} disabled={isUpdatingUnlock} onToggle={handleUnlockToggle} />
  {/if}

  {#if courseItems.length === 0}
    <Empty
      title={$t('learningPath.builder.empty_title')}
      description={$t('learningPath.builder.empty_description')}
      icon={BookIcon}
      variant="page"
    />
  {:else}
    <!-- Reorder hint if reordering -->
    {#if reorder}
      <p class="ui:text-muted-foreground mb-3 text-center text-xs italic">
        {$t('learningPath.builder.drag_hint')}
      </p>
    {/if}

    <!-- Draggable Courses List -->
    <div
      use:dndzone={{
        items: courseItems,
        flipDurationMs: 200,
        dragDisabled: !reorder,
        dropTargetStyle: {
          border: '2px #1d4ed8 solid',
          'border-style': 'dashed',
          borderRadius: '0.5rem'
        }
      }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
      class="space-y-2.5 px-1 py-1 {reorder ? 'cursor-grab active:cursor-grabbing' : ''}"
    >
      {#each courseItems as course, index (course.id)}
        <CourseRow {course} order={index + 1} {reorder} onRemove={handleOpenRemoveDialog} />
      {/each}
    </div>
  {/if}
</div>

<!-- Add Course Dialog -->
<AddCourseToPathModal
  bind:open={showAddDialog}
  pathId={path.id}
  {existingCourseIds}
  onClose={() => (showAddDialog = false)}
/>
