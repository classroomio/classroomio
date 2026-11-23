<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '../api/learning-path.svelte';

  interface Props {
    open: boolean;
    pathId: string;
  }

  let { open = $bindable(false), pathId }: Props = $props();

  const selectedIds = new SvelteSet<string>();
  let searchValue = $state('');
  let isAdding = $state(false);

  const availableCourses = $derived(
    learningPathApi.courseOptions.filter(
      (course) => !course.inPath && course.title.toLowerCase().includes(searchValue.trim().toLowerCase())
    )
  );

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) return;

    selectedIds.clear();
    searchValue = '';
  }

  function toggle(courseId: string, checked: boolean) {
    if (checked) selectedIds.add(courseId);
    else selectedIds.delete(courseId);
  }

  async function handleAdd() {
    isAdding = true;

    try {
      await learningPathApi.addCourses(pathId, [...selectedIds]);
      handleOpenChange(false);
    } finally {
      isAdding = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t('learning_paths.courses.add_title')}</Dialog.Title>
      <Dialog.Description>{$t('learning_paths.courses.add_description')}</Dialog.Description>
    </Dialog.Header>

    <Input
      placeholder={$t('learning_paths.courses.search_placeholder')}
      aria-label={$t('learning_paths.courses.search_placeholder')}
      bind:value={searchValue}
    />

    <div class="flex max-h-80 flex-col gap-1 overflow-y-auto">
      {#if learningPathApi.isLoading && learningPathApi.courseOptions.length === 0}
        {#each [0, 1, 2] as index (index)}
          <Skeleton class="h-10 w-full" />
        {/each}
      {:else if availableCourses.length === 0}
        <p class="ui:text-muted-foreground py-4 text-sm">{$t('learning_paths.courses.no_options')}</p>
      {:else}
        {#each availableCourses as course (course.id)}
          <label class="ui:hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-2">
            <Checkbox
              checked={selectedIds.has(course.id)}
              onCheckedChange={(checked) => toggle(course.id, checked === true)}
            />
            <span class="min-w-0 flex-1 truncate text-sm">{course.title}</span>
            <span class="ui:text-muted-foreground text-xs">
              {course.isPublished ? $t('learning_paths.courses.published') : $t('learning_paths.courses.draft')}
            </span>
          </label>
        {/each}
      {/if}
    </div>

    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={() => handleOpenChange(false)}>{$t('app.cancel')}</Button>
      <Button size="sm" onclick={handleAdd} disabled={selectedIds.size === 0 || isAdding} loading={isAdding}>
        {$t('learning_paths.courses.add_selected', { count: selectedIds.size })}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
