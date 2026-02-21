<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  import Navigation from '$lib/components/Navigation/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { PoweredBy } from '$features/ui';
  import { CoursesEmptyIcon } from '$features/ui/icons';
  import { CourseCardList } from '$features/course/components';

  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Empty } from '@cio/ui/custom/empty';
  import { Separator } from '@cio/ui/base/separator';

  let { data } = $props();

  let selectedTags = $state<string[]>([]);

  $effect(() => {
    selectedTags = data.activeTags ?? [];
  });

  async function applyTagFilters(nextTags: string[]) {
    const params = new URLSearchParams(page.url.searchParams);

    if (nextTags.length > 0) {
      params.set('tags', nextTags.join(','));
    } else {
      params.delete('tags');
    }

    const query = params.toString();

    await goto(`${resolve('/courses', {})}${query ? `?${query}` : ''}`, {
      keepFocus: true,
      noScroll: true,
      invalidateAll: true
    });
  }

  function toggleTag(tagSlug: string, checked: boolean) {
    const next = new Set(selectedTags);
    if (checked) {
      next.add(tagSlug);
    } else {
      next.delete(tagSlug);
    }

    applyTagFilters(Array.from(next));
  }

  function clearFilters() {
    if (selectedTags.length === 0) {
      return;
    }

    applyTagFilters([]);
  }

  function isTagSelected(tagSlug: string) {
    return selectedTags.includes(tagSlug);
  }

  const displayTagGroups = $derived.by(() => {
    const sourceGroups = data.tagGroups ?? [];
    const tagsByGroupId = new Map<string, (typeof sourceGroups)[number]['tags']>();

    for (const group of sourceGroups) {
      for (const tag of group.tags ?? []) {
        const groupId = tag.groupId || group.id;
        const existing = tagsByGroupId.get(groupId) ?? [];

        if (!existing.some((item) => item.id === tag.id)) {
          existing.push(tag);
          tagsByGroupId.set(groupId, existing);
        }
      }
    }

    return sourceGroups.map((group) => ({
      ...group,
      tags: tagsByGroupId.get(group.id) ?? []
    }));
  });
</script>

<svelte:head>
  <title>{$t('public_courses.page_title')}</title>
</svelte:head>

<PoweredBy />

<main class="min-h-screen bg-white">
  <Navigation
    logo={data.org.avatarUrl || '/logo-192.png'}
    orgName={data.org.name}
    disableSignup={true}
    isOrgSite={true}
    customLinks={data.org.landingpage?.customLinks}
  />

  <section class="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold">{$t('public_courses.heading')}</h1>
        <p class="ui:text-muted-foreground text-sm">{$t('public_courses.subtitle')}</p>
      </div>
      <Button variant="outline" onclick={clearFilters} disabled={selectedTags.length === 0}>
        {$t('public_courses.clear_filters')}
      </Button>
    </div>

    <div class="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="space-y-4 rounded-lg border p-4">
        <div>
          <h2 class="text-base font-semibold">{$t('public_courses.filters.title')}</h2>
          <p class="ui:text-muted-foreground text-xs">{$t('public_courses.filters.help')}</p>
        </div>

        <Separator />

        {#if displayTagGroups.length === 0}
          <p class="ui:text-muted-foreground text-sm">{$t('public_courses.filters.empty')}</p>
        {:else}
          <div class="space-y-5">
            {#each displayTagGroups as group (group.id)}
              <div class="space-y-2">
                <div class="space-y-1">
                  <h3 class="text-sm font-semibold">{group.name}</h3>
                  {#if group.description}
                    <p class="ui:text-muted-foreground text-xs">{group.description}</p>
                  {/if}
                </div>

                <div class="space-y-2">
                  {#each group.tags as tag (tag.id)}
                    <label
                      class="hover:ui:bg-muted/30 flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div class="flex items-center gap-2">
                        <Checkbox
                          checked={isTagSelected(tag.slug)}
                          onCheckedChange={(checked) => toggleTag(tag.slug, Boolean(checked))}
                        />
                        <span
                          class="inline-block h-2.5 w-2.5 rounded-full border"
                          style={`background-color: ${tag.color}`}
                          aria-hidden="true"
                        ></span>
                        <span class="text-sm">{tag.name}</span>
                      </div>
                      <span class="ui:text-muted-foreground text-xs">{tag.courseCount}</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </aside>

      <div class="space-y-4">
        {#if data.courses.length === 0}
          <Empty
            icon={CoursesEmptyIcon}
            title={$t('public_courses.empty.title')}
            description={$t('public_courses.empty.description')}
            variant="page"
          />
        {:else}
          <CourseCardList courses={data.courses} isOnLandingPage={true} />
        {/if}
      </div>
    </div>
  </section>
</main>
