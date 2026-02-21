<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
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
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import LessonVersionHistory from '$features/course/components/lesson/lesson-version-history.svelte';
  import { courseApi, lessonApi } from '$features/course/api';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonVideoUpload, lessonDocUpload } from '$features/course/components/lesson/store';
  import { t } from '$lib/utils/functions/translations';
  import { ContentType } from '@cio/utils/constants/content';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { Chip } from '@cio/ui/custom/chip';
  import * as Page from '@cio/ui/base/page';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import { RoleBasedSecurity } from '$features/ui';

  import {
    LessonNavigationActions,
    LanguageSelector,
    LessonPageEditHeader,
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

  const mode = $derived($page.url.searchParams.get('mode') === 'edit' ? MODES.edit : MODES.view);

  let prevModeParam = $state<string | null>(null);
  let isSaving = $state(false);
  let isDeletingLesson = $state(false);
  let isVersionDrawerOpen = $state(false);

  const lessonTitle = $derived(lessonApi.lesson?.title || 'Lesson');
  const isLessonUnlocked = $derived(lessonApi.lesson?.isUnlocked ?? false);

  function setModeQueryParam(value: (typeof MODES)[keyof typeof MODES]) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('mode', value);
    goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: false });
  }
  function setTabQueryParam(value: string) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('tab', value);
    goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: false });
  }

  function toggleMode() {
    setModeQueryParam(mode === MODES.edit ? MODES.view : MODES.edit);
  }

  const refetchDataAfterVersionRestore = async () => {
    isVersionDrawerOpen = false;
    if (courseId && browser) {
      setModeQueryParam('view');

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

  let tabs = $derived.by(() => {
    if (lessonApi.lesson?.id !== lessonId) return [];
    const ordered = orderedTabs(materialTabs, courseApi.course?.metadata?.lessonTabsOrder);
    const content = lessonApi.translations[lessonId]?.[lessonApi.currentLocale] || '';

    const slideUrl = lessonApi.lesson?.slideUrl || '';
    const videos = lessonApi.lesson?.videos || [];
    const documents = lessonApi.lesson?.documents || [];

    return ordered.map((tab) => {
      if (tab.value === 1) {
        tab.badgeValue = isHtmlValueEmpty(content) ? 0 : 1;
      } else if (tab.value === 2) {
        tab.badgeValue = !!slideUrl ? 1 : 0;
      } else if (tab.value === 3) {
        tab.badgeValue = !isEmpty(videos) ? videos.length : 0;
      } else if (tab.value === 4) {
        tab.badgeValue = !isEmpty(documents) ? documents.length : 0;
      }

      return tab;
    });
  });

  let currentTabValue = $state('');
  $effect(() => {
    if (!tabs.length || currentTabValue) return;
    const urlTab = $page.url.searchParams.get('tab');
    currentTabValue = urlTab ?? String(tabs[0].value);
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

  function hasLessonNoteContent(targetLessonId: string) {
    const rawNote = lessonApi.lesson?.note;
    const hasLegacyNote = typeof rawNote === 'string' && rawNote.trim().length > 0;
    if (hasLegacyNote) return true;

    const translations = Object.values(lessonApi.translations[targetLessonId] || {});
    return translations.some((content) => typeof content === 'string' && !isHtmlValueEmpty(content));
  }

  function patchLessonListItemLocally() {
    if (!lessonApi.lesson) return;

    courseApi.updateContentItem(lessonApi.lesson.id, ContentType.Lesson, {
      title: lessonApi.lesson.title ?? '',
      isUnlocked: lessonApi.lesson.isUnlocked ?? null,
      hasNoteContent: hasLessonNoteContent(lessonApi.lesson.id),
      hasSlideContent: Boolean(lessonApi.lesson.slideUrl?.trim()),
      videosCount: Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0,
      documentsCount: Array.isArray(lessonApi.lesson.documents) ? lessonApi.lesson.documents.length : 0
    });
  }

  async function saveLesson() {
    if (!lessonApi.lesson) return false;

    // Prevent autosave loops: we only set this back to `true` when the user edits again.
    lessonApi.isDirty = false;

    const [isLessonUpdated] = await Promise.all([
      lessonApi.update(courseApi.course?.id || '', lessonId, {
        title: lessonApi.lesson.title || undefined,
        isUnlocked: lessonApi.lesson.isUnlocked ?? undefined,
        slideUrl: lessonApi.lesson.slideUrl || undefined,
        videos: lessonApi.lesson.videos || [],
        documents: lessonApi.lesson.documents || []
      }),
      saveOrUpdateTranslation(lessonApi.currentLocale, lessonId)
    ]);

    if (isLessonUpdated) {
      patchLessonListItemLocally();
    }
  }

  function handleLessonTitleChange(value: string) {
    lessonApi.updateLessonState('title', value);
  }

  function handleToggleLessonLock() {
    const currentValue = lessonApi.lesson?.isUnlocked ?? false;
    lessonApi.updateLessonState('isUnlocked', !currentValue);
  }

  async function handleDeleteLesson() {
    if (!courseId || !lessonId || isDeletingLesson) return;

    isDeletingLesson = true;
    await lessonApi.delete(courseId, lessonId);

    if (lessonApi.success) {
      await goto(resolve(`/courses/${courseId}/lessons`, {}));
    }

    isDeletingLesson = false;
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
      }, 2000);
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

  // Only save once when leaving edit mode (e.g. Save button or browser back).
  let didHandleExitEdit = false;
  $effect(() => {
    if (!lessonId) return;

    const currentParam = $page.url.searchParams.get('mode');
    const prev = prevModeParam;
    prevModeParam = currentParam;

    const isExitEdit = prev === 'edit' && currentParam !== 'edit';

    if (!isExitEdit) {
      didHandleExitEdit = false;
      return;
    }

    if (didHandleExitEdit) return;
    didHandleExitEdit = true;

    handleSave(MODES.edit);
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
  {lessonId}
  onClose={() => {
    if ($lessonDocUpload.isUploading) return;

    $lessonDocUpload.isModalOpen = false;
    $lessonDocUpload.error = null;

    triggerAutoSave();
  }}
/>

<Page.Header>
  <Page.HeaderContent>
    <LessonPageEditHeader
      {mode}
      title={lessonTitle}
      isUnlocked={isLessonUnlocked}
      {isDeletingLesson}
      onTitleChange={handleLessonTitleChange}
      onToggleLock={handleToggleLessonLock}
      onDeleteLesson={handleDeleteLesson}
    />
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex items-center gap-2">
      {#if mode === MODES.view && $globalStore.isStudent}
        <LessonNavigationActions {lessonId} {courseId} />
      {/if}

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
        <UnderlineTabs.Root
          bind:value={currentTabValue}
          onValueChange={(e) => {
            setTabQueryParam(e);
          }}
        >
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
          <div class="mb-20 flex w-full flex-col gap-2" in:fade={{ delay: 500 }} out:fade>
            {#each viewModeComponents as Component}
              <Component {mode} {lessonId} />
            {/each}

            {#if $currentOrg.customization?.apps?.comments}
              <hr class="my-2" />

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

{#if isVersionDrawerOpen && window.innerWidth >= 1024}
  <LessonVersionHistory
    open={isVersionDrawerOpen}
    on:close={() => (isVersionDrawerOpen = false)}
    on:restore={refetchDataAfterVersionRestore}
  />
{/if}
