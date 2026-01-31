<script lang="ts">
  import { browser } from '$app/environment';
  import { untrack } from 'svelte';
  import isEmpty from 'lodash/isEmpty';
  import { writable } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import Save from '@lucide/svelte/icons/save';
  import Pencil from '@lucide/svelte/icons/pencil';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import VideoIcon from '@lucide/svelte/icons/video';

  import MODES from '$lib/utils/constants/mode';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import LessonVersionHistory from '$features/course/components/lesson/lesson-version-history.svelte';
  import { courseApi, lessonApi } from '$features/course/api';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonVideoUpload, lessonDocUpload } from '$features/course/components/lesson/store';
  import { t } from '$lib/utils/functions/translations';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { Chip } from '@cio/ui/custom/chip';
  import * as Page from '@cio/ui/base/page';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import { RoleBasedSecurity } from '$features/ui';

  import {
    BottomNavigation,
    LanguageSelector,
    Comments,
    Note,
    Slide,
    Video,
    Document,
    AddVideoModal,
    AddDocumentModal
  } from '$features/course/components/lesson';

  import type { TLocale } from '@cio/db/types';
  import { orderedTabs, tabs as materialTabs } from '$features/course/components/lesson/constants';
  import { getViewModeComponents } from '$features/course/components/lesson/utils';

  interface Props {
    courseId: string;
    lessonId: string;
  }

  let { courseId, lessonId }: Props = $props();

  let mode = $state(MODES.view);
  let prevMode = $state('');
  let isSaving = $state(false);
  let isVersionDrawerOpen = $state(false);

  const lessonTitle = $derived(lessonApi.lesson?.title || 'Lesson');

  function toggleMode() {
    prevMode = mode;
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }

  const refetchDataAfterVersionRestore = async () => {
    isVersionDrawerOpen = false;
    if (courseId && browser) {
      mode = MODES.view;

      // Refetch lesson data after version restore
      lessonApi.isLoading = true;
      await lessonApi.get(courseId, lessonId);

      if (lessonApi.success && lessonApi.lesson) {
        if ($profile.locale) {
          lessonApi.currentLocale = $profile.locale;
        }
      }

      lessonApi.isLoading = false;
    }

    snackbar.success('snackbar.lessons.success.version_restored');
  };

  const tabs = $derived.by(() => {
    const ordered = orderedTabs(materialTabs, courseApi.course?.metadata?.lessonTabsOrder);
    const content = lessonApi.translations[lessonId]?.[lessonApi.currentLocale] || '';

    const slideUrl = lessonApi.lesson?.slideUrl || '';
    const videos = lessonApi.lesson?.videos || [];
    const documents = lessonApi.lesson?.documents || [];

    return ordered.map((tab) => {
      if (tab.value === 1 && !isHtmlValueEmpty(content)) {
        tab.badgeValue = 1;
      } else if (tab.value === 2 && !!slideUrl) {
        tab.badgeValue = 1;
      } else if (tab.value === 3 && !isEmpty(videos)) {
        tab.badgeValue = videos.length;
      } else if (tab.value === 4 && !isEmpty(documents)) {
        tab.badgeValue = documents.length;
      }

      return tab;
    });
  });

  let currentTabValue = $state('');
  $effect(() => {
    if (!tabs.length || currentTabValue) return;
    currentTabValue = String(tabs[0].value);
  });

  const viewModeComponents = $derived(getViewModeComponents(tabs));

  const isMaterialsEmpty = $derived(tabs.every((tab) => tab.badgeValue === 0));

  let timeoutId: NodeJS.Timeout;

  let isLoading = writable(false);

  function callAI(_type = '') {}

  const getValue = (label: string) => {
    const tabValue = tabs.find((tab) => tab.label === label)?.value;
    return tabValue;
  };

  async function saveOrUpdateTranslation(locale: TLocale, lessonId: string) {
    const content = lessonApi.translations[lessonId]?.[locale] || '';

    if (!courseApi.course?.id) return;

    // Use API to upsert lesson language (creates if doesn't exist, updates if exists)
    await lessonApi.upsertLanguage(courseApi.course.id, lessonId, locale, content);
  }

  async function saveLesson() {
    if (!lessonApi.lesson) return false;

    // Prevent autosave loops: we only set this back to `true` when the user edits again.
    lessonApi.isDirty = false;

    await Promise.all([
      lessonApi.update(courseApi.course?.id || '', lessonId, {
        slideUrl: lessonApi.lesson.slideUrl || undefined,
        videos: lessonApi.lesson.videos || [],
        documents: lessonApi.lesson.documents || []
      }),

      saveOrUpdateTranslation(lessonApi.currentLocale, lessonId)
    ]);
  }

  function handleSave(prevMode: string) {
    untrack(() => {
      if (prevMode === MODES.edit) {
        saveLesson();
      }
    });
  }

  function autoSave() {
    if (mode === MODES.view) return;
    if (!lessonApi.isDirty) return;

    if (timeoutId) clearTimeout(timeoutId);

    untrack(() => {
      isSaving = true;
      timeoutId = setTimeout(async () => {
        await saveLesson();

        isSaving = false;
      }, 4000);
    });
  }

  const triggerAutoSave = () => {
    if (!lessonApi.lesson) return;

    autoSave();
  };

  // Only autosave after real edits, not on every reactive update.
  $effect(() => {
    if (mode !== MODES.edit) return;
    if (!lessonApi.lesson || !lessonId) return;
    if (!lessonApi.isDirty) return;
    if ($isLoading) return;

    autoSave();
  });

  // Only save once when leaving edit mode.
  let didHandleExitEdit = false;
  $effect(() => {
    if (!lessonId) return;

    const isExitEdit = prevMode === MODES.edit && mode === MODES.view;

    // reset when not in an "exit edit" state
    if (!isExitEdit) {
      didHandleExitEdit = false;
      return;
    }

    if (didHandleExitEdit) return;
    didHandleExitEdit = true;

    handleSave(prevMode);
  });
</script>

<AddVideoModal
  {lessonId}
  onClose={() => {
    if ($lessonVideoUpload.isUploading) return;

    $lessonVideoUpload.isModalOpen = false;

    triggerAutoSave();
  }}
/>

<AddDocumentModal
  onClose={() => {
    if ($lessonDocUpload.isUploading) return;

    $lessonDocUpload.isModalOpen = false;
    $lessonDocUpload.error = null;

    triggerAutoSave();
  }}
/>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{lessonTitle}</Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex items-center gap-1">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if mode === MODES.edit && window.innerWidth >= 1024}
          <IconButton onclick={() => (isVersionDrawerOpen = true)}>
            <HistoryIcon size={20} />
          </IconButton>
        {/if}

        <div class="flex-row items-center lg:flex">
          <IconButton onclick={toggleMode} disabled={isSaving}>
            {#if mode === MODES.edit}
              <Save size={20} />
            {:else}
              <Pencil size={20} />
            {/if}
          </IconButton>
        </div>

        <LanguageSelector />
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <div class="overflow-x-hidden lg:w-full xl:w-11/12">
      {#if mode === MODES.edit}
        <UnderlineTabs.Root value={currentTabValue}>
          <!-- Tabs List -->
          <UnderlineTabs.List>
            {#each tabs as tab}
              <UnderlineTabs.Trigger value={String(tab.value)}>
                {#if tab.icon}
                  <tab.icon size={16} />
                {/if}
                {$t(tab.label)}
                {#if typeof tab.badgeValue === 'number' && tab.badgeValue > 0}
                  <Chip value={`${tab.badgeValue}`} className="ml-1" />
                {/if}
              </UnderlineTabs.Trigger>
            {/each}
          </UnderlineTabs.List>
          <!-- End Tabs List -->

          <!-- Note Tab -->
          <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.note.title') || '')}>
            <Note {mode} {lessonId} {isLoading} {callAI} />
          </UnderlineTabs.Content>
          <!-- End Note Tab -->

          <!-- Slide Tab -->
          <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.slide.title') || '')}>
            <Slide {mode} />
          </UnderlineTabs.Content>
          <!-- End Slide Tab -->

          <!-- Video Tab -->
          <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.video.title') || '')}>
            <Video {mode} />
          </UnderlineTabs.Content>
          <!-- End Video Tab -->

          <!-- Document Tab -->
          <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.document.title') || '')}>
            <Document {mode} />
          </UnderlineTabs.Content>
          <!-- End Document Tab -->
        </UnderlineTabs.Root>
      {:else if lessonApi.lesson && !isMaterialsEmpty}
        {#key lessonId}
          <div class="mb-20 flex w-full flex-col gap-6" in:fade={{ delay: 500 }} out:fade>
            {#each viewModeComponents as Component}
              <Component {mode} {lessonId} />
            {/each}

            {#if $currentOrg.customization?.apps?.comments}
              <hr class="my-5" />

              <Comments {lessonId} />
            {/if}
          </div>
        {/key}
      {:else}
        <Empty
          title={$t('course.navItem.lessons.materials.body_heading')}
          description={$t('course.navItem.lessons.materials.body_content') +
            ' ' +
            $t('course.navItem.lessons.materials.get_started') +
            ' ' +
            $t('course.navItem.lessons.materials.button') +
            '.'}
          icon={VideoIcon}
          variant="page"
          class="text-center"
        >
          <Button onclick={toggleMode}>
            {$t('course.navItem.lessons.materials.get_started')}
          </Button>
        </Empty>
      {/if}
    </div>
  {/snippet}
</Page.Body>

<BottomNavigation {lessonId} {courseId} />

{#if isVersionDrawerOpen && window.innerWidth >= 1024}
  <LessonVersionHistory
    open={isVersionDrawerOpen}
    on:close={() => (isVersionDrawerOpen = false)}
    on:restore={refetchDataAfterVersionRestore}
  />
{/if}
