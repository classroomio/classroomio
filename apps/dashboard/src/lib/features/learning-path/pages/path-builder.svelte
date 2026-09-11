<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import { t } from '$lib/utils/functions/translations';
  import { UnlockToggle, CourseRow, AddCourseToPathDialog, RemoveCourseDialog, CertificateRow } from '../components';
  import { learningPathApi } from '../api';
  import type { LearningPathDetail, LearningPathCourseItem } from '../utils/types';

  interface Props {
    path: LearningPathDetail;
    basePath: string;
  }

  let { path, basePath }: Props = $props();

  let courseItems = $state<LearningPathCourseItem[]>([]);
  let showAddDialog = $state(false);
  let courseToRemove = $state<LearningPathCourseItem | null>(null);
  let showRemoveDialog = $state(false);

  $effect(() => {
    if (path && path.courses) {
      courseItems = [...path.courses];
    }
  });

  const existingCourseIds = $derived(courseItems.map((c) => c.courseId));
  const certificateHref = $derived(`${basePath}/certificate`);

  function handleDndConsider(e: CustomEvent<{ items: LearningPathCourseItem[] }>) {
    courseItems = e.detail.items;
  }

  async function handleDndFinalize(e: CustomEvent<{ items: LearningPathCourseItem[] }>) {
    const updated = e.detail.items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    courseItems = updated;
    await learningPathApi.reorderCourses(
      path.id,
      updated.map((c) => c.id)
    );
  }

  function handleUnlockToggle(nextChecked: boolean) {
    learningPathApi.updatePath(path.id, { sequentialUnlock: nextChecked });
  }

  function handleOpenRemoveDialog(course: LearningPathCourseItem) {
    courseToRemove = course;
    showRemoveDialog = true;
  }

  async function handleConfirmRemove(courseId: string) {
    await learningPathApi.removeCourse(path.id, courseId);
    courseToRemove = null;
  }
</script>

<div class="mx-auto w-full max-w-[820px] pb-12">
  <!-- Page Header -->
  <div class="mb-5">
    <h1 class="text-foreground text-2xl font-bold tracking-tight">
      {$t('learningPath.builder.title')}
    </h1>
    <p class="text-muted-foreground mt-1 text-sm">
      {$t('learningPath.builder.subtitle')}
    </p>
  </div>

  <!-- Unlock in order toggle rule card -->
  <UnlockToggle checked={path.sequentialUnlock} onToggle={handleUnlockToggle} />

  <!-- List Header -->
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-foreground text-sm font-semibold">
      {courseItems.length}
      {courseItems.length === 1 ? 'course' : 'courses'} in this path
    </h2>
    <span class="text-muted-foreground flex items-center gap-1 text-xs">
      <GripVerticalIcon class="size-3.5" />
      {$t('learningPath.builder.drag_hint')}
    </span>
  </div>

  <!-- Draggable Courses List -->
  <div
    use:dndzone={{
      items: courseItems,
      flipDurationMs: 300,
      dropTargetStyle: {
        outline: '2px dashed var(--primary)',
        outlineOffset: '2px',
        borderRadius: '8px'
      }
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    class="space-y-2.5"
  >
    {#each courseItems as course (course.id)}
      <CourseRow {course} onRemove={handleOpenRemoveDialog} />
    {/each}
  </div>

  <!-- Add Course To Path Button -->
  <button
    type="button"
    class="border-border text-muted-foreground hover:border-ring hover:text-foreground mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-xs font-semibold transition"
    onclick={() => (showAddDialog = true)}
  >
    <PlusIcon class="size-4" />
    {$t('learningPath.builder.add_course_button')}
  </button>

  <!-- Certificate Row -->
  {#if path.certificateEnabled}
    <div class="mt-3.5">
      <CertificateRow courseCount={courseItems.length} {certificateHref} />
    </div>
  {/if}
</div>

<!-- Add Course Dialog -->
<AddCourseToPathDialog
  bind:open={showAddDialog}
  pathId={path.id}
  {existingCourseIds}
  onClose={() => (showAddDialog = false)}
/>

<!-- Remove Course Dialog -->
<RemoveCourseDialog
  bind:open={showRemoveDialog}
  course={courseToRemove}
  onClose={() => {
    showRemoveDialog = false;
    courseToRemove = null;
  }}
  onConfirm={handleConfirmRemove}
/>
