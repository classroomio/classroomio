<script lang="ts">
  import { resolve } from '$app/paths';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import * as Page from '@cio/ui/base/page';
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import { Switch } from '@cio/ui/base/switch';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import ImageOffIcon from '@lucide/svelte/icons/image-off';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import TrashIcon from '@lucide/svelte/icons/trash-2';
  import Plus from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import SettingsCard from '$features/ui/settings-card.svelte';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import AddLearningPathCoursesModal from '$features/learning-path/components/add-learning-path-courses-modal.svelte';
  import LearningPathConfirmDialog from '$features/learning-path/components/learning-path-confirm-dialog.svelte';
  import type { LearningPathCourse } from '$features/learning-path/utils/types';

  const FLIP_DURATION_MS = 150;

  let { data } = $props();

  type CourseItem = LearningPathCourse & { id: string };

  let draggedItems = $state<CourseItem[] | null>(null);
  let showAddModal = $state(false);
  let courseToRemove = $state<CourseItem | null>(null);
  let showRemoveDialog = $state(false);

  const path = $derived(learningPathApi.path);
  const items = $derived<CourseItem[]>(
    draggedItems ?? (path?.courses ?? []).map((course) => ({ ...course, id: course.courseId }))
  );

  function handleConsider(event: CustomEvent<DndEvent<CourseItem>>) {
    draggedItems = event.detail.items;
  }

  async function handleFinalize(event: CustomEvent<DndEvent<CourseItem>>) {
    const nextItems = event.detail.items;
    const previousIds = (path?.courses ?? []).map((course) => course.courseId);
    const nextIds = nextItems.map((item) => item.courseId);
    draggedItems = nextItems;

    if (nextIds.join() !== previousIds.join()) {
      await learningPathApi.reorderCourses(data.pathId, nextIds);
      await learningPathApi.loadPath(data.pathId);
    }

    draggedItems = null;
  }

  async function openAddModal() {
    showAddModal = true;
    await learningPathApi.loadCourseOptions(data.pathId);
  }

  function confirmRemove(course: CourseItem) {
    courseToRemove = course;
    showRemoveDialog = true;
  }

  async function removeCourse() {
    if (!courseToRemove) return;

    await learningPathApi.removeCourse(data.pathId, courseToRemove.courseId);
    courseToRemove = null;
  }

  async function toggleSequential(checked: boolean) {
    await learningPathApi.updatePath(data.pathId, { sequentialUnlock: checked });
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learning_paths.courses.heading')}</Page.Title>
      <Page.Subtitle>
        {$isOrgAdmin ? $t('learning_paths.courses.subtitle') : $t('learning_paths.admin_only')}
      </Page.Subtitle>
    </Page.HeaderContent>
    {#if $isOrgAdmin}
      <Page.Action>
        <Button onclick={openAddModal} testId="learning-path-add-course">
          <Plus size={16} />
          {$t('learning_paths.courses.add')}
        </Button>
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if path}
        <div class="flex flex-col gap-8 pb-8">
          <SettingsCard title={$t('learning_paths.courses.order_title')}>
            <Field.Field orientation="horizontal">
              <Field.Content>
                <Field.Label for="sequential-unlock">{$t('learning_paths.fields.sequential_unlock')}</Field.Label>
                <Field.Description>{$t('learning_paths.fields.sequential_unlock_description')}</Field.Description>
              </Field.Content>
              <Switch
                id="sequential-unlock"
                checked={path.sequentialUnlock}
                disabled={learningPathApi.isSaving || !$isOrgAdmin}
                onCheckedChange={toggleSequential}
              />
            </Field.Field>
          </SettingsCard>

          {#if items.length === 0}
            <div class="flex flex-col items-start gap-3 rounded-md border border-dashed p-6">
              <p class="text-sm font-medium">{$t('learning_paths.courses.empty_title')}</p>
              <p class="ui:text-muted-foreground text-sm">{$t('learning_paths.courses.empty_description')}</p>
              {#if $isOrgAdmin}
                <Button variant="secondary" onclick={openAddModal}>{$t('learning_paths.courses.add')}</Button>
              {/if}
            </div>
          {:else}
            <div
              class="flex flex-col gap-2"
              use:dndzone={{ items, flipDurationMs: FLIP_DURATION_MS, dropTargetStyle: {}, dragDisabled: !$isOrgAdmin }}
              onconsider={handleConsider}
              onfinalize={handleFinalize}
              aria-label={$t('learning_paths.courses.reorder_label')}
            >
              {#each items as course, index (course.id)}
                <div class="ui:bg-background flex items-center gap-3 rounded-md border px-3 py-2">
                  {#if $isOrgAdmin}
                    <GripVerticalIcon size={16} class="ui:text-muted-foreground shrink-0 cursor-grab" />
                  {/if}
                  <span class="ui:text-muted-foreground w-5 shrink-0 text-sm">{index + 1}</span>

                  {#if course.bannerImage || course.logo}
                    <img
                      src={course.bannerImage || course.logo}
                      alt=""
                      class="size-10 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  {:else}
                    <div
                      class="ui:bg-muted ui:text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded"
                    >
                      <ImageOffIcon size={16} />
                    </div>
                  {/if}

                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-sm font-medium">{course.title}</span>
                    <span class="ui:text-muted-foreground text-xs">
                      {$t('learning_paths.courses.counts', {
                        lessons: course.lessonCount,
                        exercises: course.exerciseCount
                      })}
                      · {course.isPublished
                        ? $t('learning_paths.courses.published')
                        : $t('learning_paths.courses.draft')}
                    </span>
                  </div>

                  <Button
                    size="icon"
                    variant="secondary"
                    href={resolve(`/courses/${course.courseId}`, {})}
                    aria-label={$t('learning_paths.courses.open')}
                  >
                    <ExternalLinkIcon size={16} />
                  </Button>
                  {#if $isOrgAdmin}
                    <Button
                      size="icon"
                      variant="secondary"
                      onclick={() => confirmRemove(course)}
                      aria-label={$t('learning_paths.courses.remove')}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<AddLearningPathCoursesModal bind:open={showAddModal} pathId={data.pathId} />

<LearningPathConfirmDialog
  bind:open={showRemoveDialog}
  title={$t('learning_paths.courses.remove_title')}
  description={$t('learning_paths.courses.remove_description', { title: courseToRemove?.title ?? '' })}
  confirmLabel={$t('learning_paths.courses.remove')}
  destructive
  onConfirm={removeCourse}
/>
