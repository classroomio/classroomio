<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { Component } from 'svelte';
  import { goto, replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { TabComingSoon } from '$features/learning-path';
  import { LearningPathDetail } from '$features/ui';
  import { PathLandingEditor } from '$features/learning-path/components/landingpage';
  import { buildDraftLearningPathDetail } from '$features/learning-path/utils/landing-preview';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import { learningPathApi } from '$features/learning-path/api';
  import { t } from '$lib/utils/functions/translations';
  import { setLandingPageEditContext, type LandingSectionKey } from '@cio/ui/custom/org-landing-page';
  import {
    HeaderIcon,
    GoalIcon,
    LessonIcon,
    CertificateIcon,
    MoneyIcon,
    ReviewIcon,
    PersonIcon,
    ContentIcon,
    ExerciseIcon
  } from '@cio/ui/custom/moving-icons';

  const publicId = $derived(page.params.publicId ?? '');

  let sidebarOpen = $state(true);
  const initialSection = (page.url.searchParams.get('section') as LandingSectionKey) || null;
  let selectedSectionKey = $state<LandingSectionKey | null>(initialSection);
  let previewDraft = $state<{ landingPage: TLandingPage; cost: number; currency: string } | null>(null);

  const previewDetail = $derived.by(() => {
    const path = learningPathApi.currentPath;
    if (!path) return null;

    const draft = previewDraft ?? {
      landingPage: { ...(path.landingPage ?? {}) },
      cost: Number(path.cost) || 0,
      currency: typeof path.currency === 'string' ? path.currency : 'USD'
    };

    return buildDraftLearningPathDetail(path, draft.landingPage, draft.cost, draft.currency);
  });

  onMount(() => {
    if (page.url.searchParams.has('section')) {
      const url = new URL(page.url);
      url.searchParams.delete('section');
      replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
    }
  });

  const sectionIcons: Partial<Record<LandingSectionKey, Component>> = {
    header: HeaderIcon,
    requirement: ExerciseIcon,
    description: LessonIcon,
    goals: GoalIcon,
    skills: ContentIcon,
    instructors: PersonIcon,
    reviews: ReviewIcon,
    certificate: CertificateIcon,
    pricing: MoneyIcon,
    access: LessonIcon,
    faqs: ContentIcon
  };

  setLandingPageEditContext({
    selectedKey: () => (selectedSectionKey === 'header' ? 'hero' : selectedSectionKey),
    selectKey: (key) => (selectedSectionKey = key === 'hero' ? 'header' : key),
    labelFor: (key) => {
      const sectionKey = key === 'hero' ? 'header' : key;
      const translationKey = `learningPath.landing.${sectionKey}.title`;
      const label = t.get(translationKey as never);

      // svelte-i18n echoes the key path back when a translation is missing.
      return label && label !== translationKey ? label : sectionKey;
    },
    iconFor: (key) => sectionIcons[key === 'hero' ? 'header' : key] ?? HeaderIcon
  });

  function handleClose() {
    goto(resolve(`/paths/${publicId}`, {}));
  }
</script>

{#if learningPathApi.currentPath}
  <div
    class="fixed inset-0 z-250 h-screen w-screen bg-white"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <Sidebar.Provider bind:open={sidebarOpen} style="--sidebar-width: 360px; --sidebar-width-icon: 4rem">
      <Sidebar.Root side="left" collapsible="icon" class="h-full">
        <PathLandingEditor
          path={learningPathApi.currentPath}
          bind:selectedSectionKey
          bind:preview={previewDraft}
          onClose={handleClose}
        />
      </Sidebar.Root>
      <Sidebar.Inset class="relative h-screen! overflow-y-auto">
        <div class="absolute top-2 left-2 z-60">
          <Sidebar.Trigger variant="secondary" />
        </div>
        {#if previewDetail}
          <!-- Preview only: inert so staff clicks can't navigate or enroll from here. -->
          <div inert class="w-full">
            <LearningPathDetail detail={previewDetail} org={null} />
          </div>
        {:else}
          <div class="flex h-full min-h-[80vh] w-full items-center justify-center bg-white p-8">
            <TabComingSoon tabName={$t('learningPath.workspace.tabs.landing')} />
          </div>
        {/if}
      </Sidebar.Inset>
    </Sidebar.Provider>
  </div>
{/if}
