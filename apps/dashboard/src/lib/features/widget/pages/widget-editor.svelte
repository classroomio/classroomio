<script lang="ts">
  import type { WidgetDetail } from '../utils/types';
  import { widgetEditorStore } from '../store/widget-editor.store.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import WidgetIframePreview from '../components/widget-iframe-preview.svelte';
  import WidgetEditorHeader from '../components/widget-editor-header.svelte';
  import SelectCoursesPanel from '../panels/select-courses-panel.svelte';
  import LayoutPanel from '../panels/layout-panel.svelte';
  import DesignPanel from '../panels/design-panel.svelte';
  import EmbedPanel from '../panels/embed-panel.svelte';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import Share2Icon from '@lucide/svelte/icons/share-2';

  const store = widgetEditorStore;

  let { detail: initialDetail }: { detail: WidgetDetail } = $props();

  $effect(() => store.syncFromInitial(initialDetail));

  $effect(() => {
    if (!store.detail || !$currentOrg.id) return;

    return store.startPreviewEffect();
  });

  function navButtonVariant(id: typeof store.activePanel): 'default' | 'ghost' {
    return store.activePanel === id ? 'default' : 'ghost';
  }
</script>

{#if store.detail}
  <div class="ui:bg-background ui:text-foreground flex h-dvh flex-col">
    <WidgetEditorHeader
      bind:draftName={store.draftName}
      status={store.detail.widget.status}
      isPaidPlan={store.detail.planGatedFields.isPaidPlan}
      isDirty={store.isDirty}
      layoutValidationError={store.layoutValidationError}
      editingName={store.editingName}
      onSave={() => store.saveWidget()}
      onPublish={() => store.publishWidget()}
      onDiscard={() => store.resetDraft()}
      onRenameStart={() => (store.editingName = true)}
      onRenameFinish={() => (store.editingName = false)}
    />

    <div class="flex min-h-0 flex-1">
      <!-- Icon rail -->
      <nav
        class="ui:border-border ui:bg-secondary flex w-14 shrink-0 flex-col items-center gap-1.5 border-r py-3"
        aria-label={$t('widgets.heading')}
      >
        <IconButton
          type="button"
          variant={navButtonVariant('select-courses')}
          tooltip={$t('widgets.tabs.select_courses')}
          tooltipSide="right"
          aria-label={$t('widgets.tabs.select_courses')}
          aria-current={store.activePanel === 'select-courses' ? 'page' : undefined}
          onclick={() => (store.activePanel = 'select-courses')}
        >
          <GraduationCapIcon class="size-4" />
        </IconButton>
        <IconButton
          type="button"
          variant={navButtonVariant('layout')}
          tooltip={$t('widgets.tabs.layout')}
          tooltipSide="right"
          aria-label={$t('widgets.tabs.layout')}
          aria-current={store.activePanel === 'layout' ? 'page' : undefined}
          onclick={() => (store.activePanel = 'layout')}
        >
          <LayoutGridIcon class="size-4" />
        </IconButton>
        <IconButton
          type="button"
          variant={navButtonVariant('design')}
          tooltip={$t('widgets.tabs.design')}
          tooltipSide="right"
          aria-label={$t('widgets.tabs.design')}
          aria-current={store.activePanel === 'design' ? 'page' : undefined}
          onclick={() => (store.activePanel = 'design')}
        >
          <PaletteIcon class="size-4" />
        </IconButton>
        <IconButton
          type="button"
          variant={navButtonVariant('embed')}
          tooltip={$t('widgets.tabs.embed')}
          tooltipSide="right"
          aria-label={$t('widgets.tabs.embed')}
          aria-current={store.activePanel === 'embed' ? 'page' : undefined}
          onclick={() => (store.activePanel = 'embed')}
        >
          <Share2Icon class="size-4" />
        </IconButton>
      </nav>

      <!-- Settings panel -->
      <aside class="ui:border-border ui:bg-card flex w-[min(100%,380px)] shrink-0 flex-col border-r">
        <div class="ui:border-border border-b px-5 py-4">
          {#if store.activePanel === 'select-courses'}
            <h2 class="text-sm font-semibold">{$t('widgets.tabs.select_courses')}</h2>
          {:else if store.activePanel === 'layout'}
            <h2 class="text-sm font-semibold">{$t('widgets.editor.pick_layout')}</h2>
          {:else if store.activePanel === 'design'}
            <h2 class="text-sm font-semibold">{$t('widgets.editor.pick_design')}</h2>
          {:else}
            <h2 class="text-sm font-semibold">{$t('widgets.editor.embed_share')}</h2>
          {/if}
          <p class="ui:text-muted-foreground mt-1 text-xs">{$t('widgets.editor.panel_subtitle')}</p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {#if store.activePanel === 'select-courses'}
            <SelectCoursesPanel
              detail={store.detail}
              bind:draftSelectionMode={store.draftSelectionMode}
              bind:selectedCourseIds={store.selectedCourseIds}
              bind:courseSearch={store.courseSearch}
              bind:filterPublished={store.filterPublished}
              bind:filterCourseType={store.filterCourseType}
              bind:filterTagSlugs={store.filterTagSlugs}
              filteredCourses={store.filteredCourses}
              activeFilterCount={store.activeFilterCount}
              onContinueToLayout={() => (store.activePanel = 'layout')}
              onClearFilters={() => store.clearFilters()}
            />
          {:else if store.activePanel === 'layout'}
            <LayoutPanel
              bind:draftLayoutType={store.draftLayoutType}
              bind:draftConfig={store.draftConfig}
              featuredCourseOptions={store.featuredCourseOptions}
              tagOptions={store.tagOptions}
              layoutValidationError={store.layoutValidationError}
              onToggleCategoryTag={(tagId, checked) => store.toggleCategoryTag(tagId, checked)}
            />
          {:else if store.activePanel === 'design'}
            <DesignPanel
              bind:draftConfig={store.draftConfig}
              availableThemes={store.detail.planGatedFields.availableThemes}
              canUseCustomColors={store.detail.planGatedFields.canUseCustomColors}
              canUseCustomCss={store.detail.planGatedFields.canUseCustomCss}
              isBrandingForced={store.detail.planGatedFields.isBrandingForced}
            />
          {:else}
            <EmbedPanel
              detail={store.detail}
              onRollback={(versionId) => store.rollback(versionId)}
              onDelete={() => store.deleteWidget()}
            />
          {/if}
        </div>
      </aside>

      <!-- Preview canvas -->
      <section
        class="relative flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-100 bg-[radial-gradient(circle,#d4d4d8_1px,transparent_1px)] bg-size-[18px_18px] dark:bg-zinc-950 dark:bg-[radial-gradient(circle,rgba(113,113,122,0.4)_1px,transparent_1px)]"
        aria-label={$t('widgets.preview.heading')}
      >
        <div class="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4 sm:p-6 lg:p-8">
          <div
            class="ui:border-border ui:bg-card/90 w-full max-w-5xl rounded-xl border p-4 shadow-sm backdrop-blur sm:p-8 dark:shadow-black/20"
          >
            <WidgetIframePreview payload={store.previewPayload} />
          </div>
        </div>
      </section>
    </div>
  </div>
{/if}
