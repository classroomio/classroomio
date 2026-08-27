<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import ImageOffIcon from '@lucide/svelte/icons/image-off';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { page } from '$app/state';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import * as Field from '@cio/ui/base/field';
  import * as Popover from '@cio/ui/base/popover';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { orgApi } from '$features/org/api/org.svelte';
  import type { OrgLandingPageJson } from '$lib/utils/types/org';
  import type { OrgPublicCourses } from '$features/org/utils/types';
  import { SvelteSet } from 'svelte/reactivity';

  const MAX_COURSES = 4;

  interface OrderedCourseItem {
    id: string;
    title: string;
    logo: string;
    displayOrder: number | null;
  }

  interface Props {
    settings?: OrgLandingPageJson;
    markDirty?: () => void;
    onSave?: () => Promise<void> | void;
    registerSaveHandler?: (fn: (() => Promise<boolean> | void) | null) => void;
  }

  let { settings = $bindable(), markDirty, registerSaveHandler }: Props = $props();

  void settings;

  type DndEvent = CustomEvent<{ items: OrderedCourseItem[] }>;

  const FLIP_DURATION_MS = 200;

  let rawPublicCourses = $state<OrgPublicCourses>([]);
  let allCourses = $state<OrderedCourseItem[]>([]);
  let selectedCourses = $state<OrderedCourseItem[]>([]);
  let selectedIds = new SvelteSet<string>();
  let isLoadingCourses = $state(false);
  let hasLoadFailed = $state(false);
  let loadedSiteName = $state<string | null>(null);

  let popoverOpen = $state(false);
  let popoverWasOpen = $state(false);

  let searchQuery = $state('');
  let hasOrderChanged = $state(false);

  let itemsBeforeDrag: OrderedCourseItem[] = [];

  const siteName = $derived($currentOrg.siteName || page.params.slug || '');

  const filteredCourses = $derived(
    searchQuery.trim()
      ? allCourses.filter((c) => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : allCourses
  );

  $effect(() => {
    registerSaveHandler?.(persistSelection);
    return () => registerSaveHandler?.(null);
  });

  $effect(() => {
    if (!siteName || loadedSiteName === siteName) {
      return;
    }

    loadedSiteName = siteName;
    void loadPublishedCourses();
  });

  $effect(() => {
    if (popoverWasOpen && !popoverOpen) {
      searchQuery = '';
    }
    popoverWasOpen = popoverOpen;
  });

  function updatePreview(selected: OrderedCourseItem[]) {
    if (!rawPublicCourses.length) return;
    const rawMap = new Map(rawPublicCourses.map((c) => [c.id, c]));
    orgApi.publicCourses = selected
      .map((sc, index) => {
        const raw = rawMap.get(sc.id);
        if (!raw) return null;
        return {
          ...raw,
          displayOrder: index
        };
      })
      .filter((c): c is OrgPublicCourses[number] => c !== null);
  }

  function buildCourses(courses: OrgPublicCourses) {
    rawPublicCourses = courses;

    const items: OrderedCourseItem[] = courses.map((course) => ({
      id: course.id,
      title: typeof course.title === 'string' ? course.title : '',
      logo: typeof course.logo === 'string' ? course.logo : '',
      displayOrder: typeof course.displayOrder === 'number' ? course.displayOrder : null
    }));

    const selected = items
      .filter((c) => c.displayOrder !== null)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const ids = new SvelteSet(selected.map((c) => c.id));

    allCourses = items;
    selectedCourses = selected;
    selectedIds = ids;
  }

  async function loadPublishedCourses() {
    isLoadingCourses = true;
    hasLoadFailed = false;

    try {
      const courses = await orgApi.listPublishedCoursesForOrdering(siteName);
      buildCourses(courses);
    } catch {
      hasLoadFailed = true;
    } finally {
      isLoadingCourses = false;
    }
  }

  function handleDndConsider(event: DndEvent) {
    if (!itemsBeforeDrag.length) {
      itemsBeforeDrag = [...selectedCourses];
    }
    selectedCourses = event.detail.items;
  }

  function handleDndFinalize(event: DndEvent) {
    const nextItems = event.detail.items;
    const orderChanged = itemsBeforeDrag.some((item, index) => nextItems[index]?.id !== item.id);

    itemsBeforeDrag = [];
    selectedCourses = nextItems;
    updatePreview(selectedCourses);

    if (!orderChanged) {
      return;
    }

    hasOrderChanged = true;
    markDirty?.();
  }

  async function persistSelection(): Promise<boolean> {
    if (!hasOrderChanged) {
      return true;
    }

    const orders = selectedCourses.map((item, index) => ({
      id: item.id,
      order: index
    }));

    const result = await orgApi.reorderPublishedCourses(orders, { showToast: false });

    if (result) {
      hasOrderChanged = false;
      void orgApi.refreshPublicCourses(siteName);
      return true;
    }

    return false;
  }

  function toggleCourse(courseId: string, checked: boolean) {
    if (checked) {
      if (selectedCourses.length >= MAX_COURSES) {
        return;
      }

      const course = allCourses.find((c) => c.id === courseId);
      if (!course) {
        return;
      }

      selectedIds.add(courseId);
      selectedIds = new SvelteSet(selectedIds);
      selectedCourses = [...selectedCourses, { ...course, displayOrder: selectedCourses.length }];
    } else {
      selectedIds.delete(courseId);
      selectedIds = new SvelteSet(selectedIds);
      selectedCourses = selectedCourses.filter((c) => c.id !== courseId);
    }

    updatePreview(selectedCourses);
    hasOrderChanged = true;
    markDirty?.();
  }

  function isAtLimit(): boolean {
    return selectedCourses.length >= MAX_COURSES;
  }
</script>

<Field.Group class="space-y-6">
  <Field.Set>
    <div class="flex items-center justify-between">
      <Field.Legend>{$t('settings.landing_page.editor.sections.courses')}</Field.Legend>

      <Popover.Root bind:open={popoverOpen}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="secondary">
              <PlusIcon size={14} />
              {$t('settings.landing_page.editor.courses.add_button')}
            </Button>
          {/snippet}
        </Popover.Trigger>

        <Popover.Content align="end" class="w-80 p-0!">
          <div class="border-b px-4 py-3">
            <p class="text-sm font-semibold">
              {$t('settings.landing_page.editor.courses.popover_title')}
              <span class="ui:text-muted-foreground font-normal">
                ({selectedCourses.length}/{MAX_COURSES})
              </span>
            </p>
          </div>

          <div class="px-4 py-2">
            <div class="relative">
              <Input bind:value={searchQuery} placeholder="Search courses..." class="h-8 text-xs" />
            </div>
          </div>

          <div class="max-h-64 overflow-y-auto px-4 py-2">
            {#if allCourses.length === 0}
              <p class="ui:text-muted-foreground py-4 text-center text-xs">
                {$t('settings.landing_page.editor.courses.popover_empty')}
              </p>
            {:else if filteredCourses.length === 0}
              <p class="ui:text-muted-foreground py-4 text-center text-xs">No courses match your search.</p>
            {:else}
              {#each filteredCourses as course (course.id)}
                {@const isChecked = selectedIds.has(course.id)}
                <label class="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
                  <span class="min-w-0 flex-1 truncate text-sm">{course.title}</span>
                  <Checkbox
                    checked={isChecked}
                    disabled={!isChecked && isAtLimit()}
                    onCheckedChange={(checked) => toggleCourse(course.id, Boolean(checked))}
                  />
                </label>
              {/each}
            {/if}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>

    <Field.Description>{$t('settings.landing_page.editor.sections.courses_desc')}</Field.Description>

    <div class="space-y-3">
      <p class="ui:text-muted-foreground text-xs">
        {$t('settings.landing_page.editor.courses.drag_hint')}
      </p>

      {#if hasLoadFailed}
        <p class="text-sm text-red-600">{$t('settings.landing_page.editor.courses.load_failed')}</p>
      {:else if isLoadingCourses}
        {#each Array(3) as _, index (index)}
          <div class="flex animate-pulse items-center gap-3 rounded-md border border-gray-200 px-3 py-2">
            <div class="size-10 shrink-0 rounded bg-gray-200" aria-hidden="true"></div>
            <div class="h-4 w-1/2 rounded bg-gray-200" aria-hidden="true"></div>
          </div>
        {/each}
      {:else if selectedCourses.length === 0}
        <p class="ui:text-muted-foreground text-sm">
          {$t('settings.landing_page.editor.courses.empty')}
        </p>
      {:else}
        <div
          class="cursor-grab space-y-2 active:cursor-grabbing"
          use:dndzone={{
            items: selectedCourses,
            flipDurationMs: FLIP_DURATION_MS,
            dropTargetStyle: {
              border: '2px #1d4ed8 solid',
              'border-style': 'dashed'
            }
          }}
          onconsider={handleDndConsider}
          onfinalize={handleDndFinalize}
        >
          {#each selectedCourses as courseItem, index (courseItem.id)}
            <div
              class="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 transition hover:bg-gray-50"
            >
              <span
                class="ui:bg-primary/10 ui:text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              >
                {index + 1}
              </span>

              {#if courseItem.logo}
                <img src={courseItem.logo} alt="" class="size-10 shrink-0 rounded object-cover" loading="lazy" />
              {:else}
                <div
                  class="ui:text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded bg-gray-100"
                >
                  <ImageOffIcon size={16} />
                </div>
              {/if}

              <span class="min-w-0 flex-1 truncate text-sm font-medium">{courseItem.title}</span>

              <GripVerticalIcon size={16} class="ui:text-muted-foreground shrink-0" />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </Field.Set>
</Field.Group>
