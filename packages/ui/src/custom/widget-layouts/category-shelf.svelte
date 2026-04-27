<script lang="ts">
  import { untrack } from 'svelte';
  import type { TWidgetPayload, TWidgetPayloadCourse } from '@cio/utils/validation/widget';
  import Stars from './atoms/stars.svelte';
  import TypeBadge from './atoms/type-badge.svelte';
  import Thumb from './atoms/thumb.svelte';

  let { payload }: { payload: TWidgetPayload } = $props();

  const options = $derived(payload.design.layoutOptions.categoryShelf);
  const courseById = $derived(new Map(payload.courses.map((course) => [course.id, course])));
  const categories = $derived(payload.categories);
  const tabs = $derived(
    options.showAllTab
      ? [
          { id: 'all', label: 'All courses', courseIds: payload.courses.map((c) => c.id) },
          ...categories.map((cat) => ({ id: cat.tagId, label: cat.name, courseIds: cat.courseIds }))
        ]
      : categories.map((cat) => ({ id: cat.tagId, label: cat.name, courseIds: cat.courseIds }))
  );

  let activeId = $state<string>(
    untrack(() => {
      const initialOptions = payload.design.layoutOptions.categoryShelf;
      const initialCategories = payload.categories;
      return (
        initialOptions.defaultCategoryTagId ?? (initialOptions.showAllTab ? 'all' : (initialCategories[0]?.tagId ?? ''))
      );
    })
  );

  const activeCourses = $derived.by<TWidgetPayloadCourse[]>(() => {
    const tab = tabs.find((entry) => entry.id === activeId) ?? tabs[0];
    if (!tab) return [];
    return tab.courseIds
      .map((id) => courseById.get(id))
      .filter((course): course is TWidgetPayloadCourse => course !== undefined)
      .slice(0, options.maxPerCategory);
  });

  $effect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeId)) {
      activeId = tabs[0].id;
    }
  });
</script>

{#if tabs.length === 0}
  <div class="cio-empty">Add at least one category tag to display this layout.</div>
{:else}
  <div class="cio-shelf-tabs" role="tablist">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class="cio-shelf-tab"
        class:cio-on={tab.id === activeId}
        onclick={() => (activeId = tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="cio-shelf-pane">
    {#if activeCourses.length === 0}
      <div class="cio-empty">No courses in this category yet.</div>
    {:else}
      <div class="cio-shelf-grid">
        {#each activeCourses as course (course.id)}
          <a class="cio-shelf-card" href={course.url} target="_blank" rel="noreferrer noopener">
            {#if payload.design.content.showCourseImage}
              <div class="cio-shelf-img">
                <Thumb src={course.imageUrl} alt={course.title} />
              </div>
            {/if}
            <div class="cio-shelf-body">
              <h3 class="cio-shelf-title">{course.title}</h3>
              <div class="cio-shelf-meta-row">
                {#if payload.design.content.showCourseTypeBadge}
                  <TypeBadge courseType={course.courseType} />
                {/if}
                <Stars rating={course.rating} ratingCount={course.ratingCount} />
              </div>
              {#if course.tags.length > 0}
                <div class="cio-shelf-tags-row">
                  {#each course.tags.slice(0, 2) as tag (tag.id)}
                    <span class="cio-pill">{tag.name}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
{/if}
