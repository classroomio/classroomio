<script lang="ts">
  import type { Component } from 'svelte';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import { CloseButton, UnsavedChanges } from '$features/ui';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import type { OrgLandingPageJson } from '$lib/utils/types/org';
  import type { LandingSectionKey } from '@cio/ui/custom/org-landing-page';
  import { landingPageEditorSelection } from '$features/settings/utils/store';
  import {
    ContentIcon,
    ExploreIcon,
    ExternalLinkIcon,
    GoalIcon,
    HeaderIcon,
    SettingsIcon
  } from '@cio/ui/custom/moving-icons';

  import HeroSection from './landingpage-editor/hero-section.svelte';
  import NavigationSection from './landingpage-editor/navigation-section.svelte';
  import LinksSection from './landingpage-editor/links-section.svelte';
  import CalloutSection from './landingpage-editor/callout-section.svelte';
  import EmbedSection from './landingpage-editor/embed-section.svelte';
  import FooterSection from './landingpage-editor/footer-section.svelte';

  interface Props {
    settings: OrgLandingPageJson;
    onSave: () => Promise<void> | void;
    onClose: () => void;
  }

  type SectionKey = LandingSectionKey;

  interface SectionDefinition {
    key: SectionKey;
    title: string;
    icon: typeof HeaderIcon;
    component: Component;
  }

  let { settings = $bindable(), onSave, onClose }: Props = $props();

  const sidebar = useSidebar();

  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);

  const sections: SectionDefinition[] = [
    {
      key: 'navigation',
      title: t.get('settings.landing_page.editor.sections.navigation'),
      icon: ContentIcon,
      component: NavigationSection
    },
    {
      key: 'hero',
      title: t.get('settings.landing_page.editor.sections.hero'),
      icon: HeaderIcon,
      component: HeroSection
    },
    {
      key: 'links',
      title: t.get('settings.landing_page.editor.sections.links'),
      icon: ExploreIcon,
      component: LinksSection
    },
    {
      key: 'embed',
      title: t.get('settings.landing_page.editor.sections.embed'),
      icon: ExternalLinkIcon,
      component: EmbedSection
    },
    {
      key: 'callout',
      title: t.get('settings.landing_page.editor.sections.callout'),
      icon: GoalIcon,
      component: CalloutSection
    },
    {
      key: 'footer',
      title: t.get('settings.landing_page.editor.sections.footer'),
      icon: SettingsIcon,
      component: FooterSection
    }
  ];

  const selectedSectionDefinition = $derived(
    sections.find((section) => section.key === $landingPageEditorSelection) ?? null
  );

  function markDirty() {
    hasUnsavedChanges = true;
  }

  function handleClose() {
    if ($landingPageEditorSelection) {
      $landingPageEditorSelection = null;
      return;
    }

    onClose();
  }

  async function handleSaveClick() {
    isSaving = true;

    try {
      await onSave();
      hasUnsavedChanges = false;
    } finally {
      isSaving = false;
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Sidebar.Header
  class="flex flex-row! items-center {sidebar.open ? 'justify-between' : 'justify-center'} border-b px-2 py-2"
>
  {#if !$landingPageEditorSelection}
    {#if sidebar.open}
      <CloseButton onClick={handleClose} />

      <div class="flex items-center gap-2">
        <Button type="button" variant="outline" onclick={handleSaveClick} loading={isSaving} disabled={isSaving}>
          {$t('settings.landing_page.editor.save')}
        </Button>
      </div>
    {:else}
      <CloseButton onClick={handleClose} />
    {/if}
  {:else if sidebar.open || !sidebar.isMobile}
    <div class="flex items-center gap-2">
      <IconButton onclick={() => ($landingPageEditorSelection = null)}>
        <ArrowLeftIcon size={16} />
      </IconButton>
      <h3 class="text-sm font-semibold">
        {selectedSectionDefinition?.title}
      </h3>
    </div>
  {:else}
    <IconButton onclick={() => ($landingPageEditorSelection = null)} tooltip={selectedSectionDefinition?.title ?? ''}>
      <ArrowLeftIcon size={16} />
    </IconButton>
  {/if}
</Sidebar.Header>

<Sidebar.Content class="flex-1 overflow-y-auto">
  {#if !$landingPageEditorSelection}
    <Sidebar.Group>
      <Sidebar.GroupLabel class="px-2">
        {$t('settings.landing_page.editor.page_builder')}
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each sections as section (section.key)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                onclick={() => ($landingPageEditorSelection = section.key)}
                tooltipContent={section.title}
              >
                {@const SectionIcon = section.icon}
                <SectionIcon size={16} />
                <span>{section.title}</span>
                <ChevronRightIcon size={16} />
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  {:else if selectedSectionDefinition}
    {@const SectionComponent = selectedSectionDefinition.component}
    <div class="p-4">
      <SectionComponent bind:settings {markDirty} />
    </div>
  {/if}
</Sidebar.Content>
