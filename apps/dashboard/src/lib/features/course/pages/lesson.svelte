<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import isEmpty from 'lodash/isEmpty';
  import { writable } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import Save from '@lucide/svelte/icons/save';
  import Pencil from '@lucide/svelte/icons/pencil';
  // import HistoryIcon from '@lucide/svelte/icons/history';
  import VideoIcon from '@lucide/svelte/icons/video';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  import MODES from '$lib/utils/constants/mode';
  import { profile } from '$lib/utils/store/user';
  import { isOrgStudent, isStudentExperience } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import { RefreshPageData, UnsavedChanges } from '$features/ui';
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
    ContentNavigationActions,
    LanguageSelector,
    LessonPageEditHeader,
    Comments,
    Note,
    Slide,
    Video,
    Document,
    AddVideoModal,
    AddDocumentModal,
    LessonSettingsTab,
    LessonMaterialActions
  } from '$features/course/components/lesson';

  import type { TLocale } from '@cio/db/types';
  import { orderedTabs, SETTINGS_TAB_VALUE, tabs as materialTabs } from '$features/course/components/lesson/constants';
  import { getViewModeComponents } from '$features/course/components/lesson/utils';
  import { loadDraft, clearDraft } from '$features/course/utils/lesson-draft';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import StudentContentLockedNotice from '$features/course/components/student-content-locked-notice.svelte';
  import LiveSessionCard from '$features/course/components/lesson/live-session-card.svelte';

  interface Props {
    courseId: string;
    lessonId: string;
  }

  let { courseId, lessonId }: Props = $props();

  const mode = $derived($page.url.searchParams.get('mode') === 'edit' ? MODES.edit : MODES.view);

  let prevModeParam = $state<string | null>(null);
  let isDeletingLesson = $state(false);
  let isVersionDrawerOpen = $state(false);
  // eslint-disable-next-line svelte/prefer-writable-derived -- must be writable: cleared before intentional navigations and bound to UnsavedChanges
  let hasUnsavedChanges = $state(false);

  $effect(() => {
    hasUnsavedChanges = lessonApi.isDirty && mode === MODES.edit;
  });

  const currentLessonContentItem = $derived(
    getOrderedNavigableContent(courseApi.course).find(
      (item) => item.type === ContentType.Lesson && item.id === lessonId
    )
  );
  const lessonTitle = $derived(currentLessonContentItem?.title || lessonApi.lesson?.title || 'Lesson');
  const isTeacherLocked = $derived.by(() => {
    if ($isOrgStudent && currentLessonContentItem) {
      return (currentLessonContentItem.isUnlocked ?? false) === false;
    }

    return (lessonApi.lesson?.isUnlocked ?? false) === false;
  });
  const isProgressionLocked = $derived(
    $isOrgStudent && currentLessonContentItem?.accessible === false && !isTeacherLocked
  );
  const isLessonUnlocked = $derived(!isTeacherLocked && !isProgressionLocked);
  const lessonSlug = $derived(lessonApi.lesson?.slug ?? '');
  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');
  const isLiveSessionLesson = $derived(Boolean(lessonApi.lesson?.callUrl && lessonApi.lesson?.lessonAt));

  function setModeQueryParam(value: (typeof MODES)[keyof typeof MODES]) {
    const params = new SvelteURLSearchParams($page.url.searchParams);
    params.set('mode', value);
    goto(resolve(`${$page.url.pathname}?${params.toString()}`, {}), { replaceState: false });
  }
  function setTabQueryParam(value: string) {
    const params = new SvelteURLSearchParams($page.url.searchParams);
    params.set('tab', value);
    goto(resolve(`${$page.url.pathname}?${params.toString()}`, {}), { replaceState: false });
  }

  function toggleMode() {
    if (mode === MODES.edit && lessonApi.isDirty) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = undefined;
      saveLesson();
    }
    hasUnsavedChanges = false;
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
        tab.badgeValue = slideUrl ? 1 : 0;
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
    if (urlTab === SETTINGS_TAB_VALUE) {
      currentTabValue = SETTINGS_TAB_VALUE;
      return;
    }

    currentTabValue = urlTab ?? String(tabs[0].value);
  });

  const viewModeComponents = $derived(getViewModeComponents(tabs));

  const isMaterialsEmpty = $derived(tabs.every((tab) => tab.badgeValue === 0));
  const hasLessonVideos = $derived((lessonApi.lesson?.videos?.length ?? 0) > 0);

  let timeoutId: NodeJS.Timeout | undefined;

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

    const [isLessonUpdated] = await Promise.all([
      lessonApi.update(courseApi.course?.id || '', lessonId, {
        title: lessonApi.lesson.title || undefined,
        isUnlocked: lessonApi.lesson.isUnlocked ?? undefined,
        completionPolicy: lessonApi.lesson.completionPolicy ?? undefined,
        videoWatchThreshold: lessonApi.lesson.videoWatchThreshold ?? undefined,
        slideUrl: lessonApi.lesson.slideUrl || undefined,
        videos: lessonApi.lesson.videos || [],
        documents: lessonApi.lesson.documents || [],
        slug: isPublicCourse && lessonApi.lesson.slug ? lessonApi.lesson.slug : undefined
      }),
      saveOrUpdateTranslation(lessonApi.currentLocale, lessonId)
    ]);

    if (isLessonUpdated) {
      patchLessonListItemLocally();
      clearDraft(lessonId, lessonApi.currentLocale);
      lessonApi.isDirty = false;
    }
  }

  function handleLessonTitleChange(value: string) {
    lessonApi.updateLessonState('title', value);
  }

  function handleLessonSlugChange(value: string) {
    lessonApi.updateLessonState('slug', value);
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
      hasUnsavedChanges = false;
      await goto(resolve(`/courses/${courseId}/lessons`, {}));
    }

    isDeletingLesson = false;
  }

  function handleSave(prevMode: string) {
    untrack(() => {
      if (prevMode === MODES.edit) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = undefined;
        saveLesson();
      }
    });
  }

  function autoSave() {
    if (mode === MODES.view) return;
    if (!lessonApi.isDirty) return;

    if (timeoutId) clearTimeout(timeoutId);

    untrack(() => {
      timeoutId = setTimeout(async () => {
        await saveLesson();
      }, 2000);
    });
  }

  const triggerAutoSave = () => {
    if (!lessonApi.lesson) return;

    autoSave();
  };

  // Check for an unsaved localStorage draft when the lesson first loads.
  let draftCheckedForLesson = '';
  $effect(() => {
    if (!browser) return;
    if (!lessonApi.lesson || !lessonId) return;
    if (draftCheckedForLesson === lessonId) return;
    draftCheckedForLesson = lessonId;

    const draft = loadDraft(lessonId, lessonApi.currentLocale);
    if (!draft) return;

    const serverContent = lessonApi.translations[lessonId]?.[lessonApi.currentLocale] || '';
    if (draft.content === serverContent) {
      clearDraft(lessonId, lessonApi.currentLocale);
      return;
    }

    const shouldRestore = window.confirm(t.get('course.navItem.lessons.draft_recovery'));
    if (shouldRestore) {
      if (!lessonApi.translations[lessonId]) {
        lessonApi.translations[lessonId] = {} as Record<TLocale, string>;
      }
      lessonApi.translations[lessonId][lessonApi.currentLocale] = draft.content;
      lessonApi.isDirty = true;
    } else {
      clearDraft(lessonId, lessonApi.currentLocale);
    }
  });

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
      isUnlocked={lessonApi.lesson?.isUnlocked ?? false}
      {isDeletingLesson}
      onTitleChange={handleLessonTitleChange}
      onToggleLock={handleToggleLessonLock}
      onDeleteLesson={handleDeleteLesson}
      slug={lessonSlug}
      showSlugEditor={isPublicCourse}
      slugError={lessonApi.errors.slug}
      onSlugChange={handleLessonSlugChange}
    />
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex items-center gap-2">
      {#if mode === MODES.view && $isStudentExperience}
        <ContentNavigationActions {lessonId} {courseId} />
      {/if}

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <div class="flex flex-row items-center gap-2 lg:flex">
          <!--
          {#if mode === MODES.edit && window.innerWidth >= 1024}
            <IconButton onclick={() => (isVersionDrawerOpen = true)}>
              <HistoryIcon size={20} />
            </IconButton>
          {/if}
          -->

          {#if mode === MODES.edit}
            <span class="ui:text-muted-foreground text-sm" aria-live="polite">
              {#if lessonApi.isSaving}
                {$t('course.navItem.lessons.saving')}
              {:else if !lessonApi.isDirty}
                {$t('course.navItem.lessons.saved')}
              {/if}
            </span>
          {/if}
          <IconButton onclick={toggleMode} disabled={lessonApi.isSaving}>
            {#if mode === MODES.edit}
              <Save size={20} />
            {:else}
              <Pencil size={20} />
            {/if}
          </IconButton>
        </div>

        <RefreshPageData onRefresh={() => lessonApi.get(courseId, lessonId)} />
      </RoleBasedSecurity>

      <LanguageSelector />
    </div>
  </Page.Action>
</Page.Header>

<Page.Body>
  {#snippet child()}
    <div class={`overflow-x-hidden pb-6 ${mode === MODES.edit ? 'lg:w-full xl:w-11/12' : 'mx-auto w-full max-w-3xl'}`}>
      {#if isLiveSessionLesson && mode === MODES.view && !($isOrgStudent && !isLessonUnlocked)}
        <div class="mb-4">
          <LiveSessionCard
            title={lessonTitle}
            callUrl={lessonApi.lesson?.callUrl ?? ''}
            lessonAt={lessonApi.lesson?.lessonAt ?? ''}
            timezone={courseApi.course?.metadata?.sessionTimezone}
          />
        </div>
      {/if}

      {#if $isOrgStudent && !isLessonUnlocked}
        <StudentContentLockedNotice
          reason={isProgressionLocked ? 'progression_locked' : 'teacher_locked'}
          contentType={ContentType.Lesson}
        />
      {:else if mode === MODES.edit}
        <UnderlineTabs.Root
          bind:value={currentTabValue}
          onValueChange={(e) => {
            setTabQueryParam(e);
          }}
        >
          <!-- Tabs List -->
          <UnderlineTabs.List>
            {#each tabs as tab (tab.value)}
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
            <UnderlineTabs.Trigger value={SETTINGS_TAB_VALUE}>
              <SettingsIcon size={16} />
              {$t('course.navItem.lessons.materials.tabs.settings.title')}
            </UnderlineTabs.Trigger>
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
            <Video {mode} {courseId} {lessonId} />
          </UnderlineTabs.Content>
          <!-- End Video Tab -->

          <!-- Document Tab -->
          <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.document.title') || '')}>
            <Document {mode} />
          </UnderlineTabs.Content>
          <!-- End Document Tab -->

          <!-- Settings Tab (fixed, not part of lessonTabsOrder) -->
          <UnderlineTabs.Content value={SETTINGS_TAB_VALUE}>
            <LessonSettingsTab />
          </UnderlineTabs.Content>
          <!-- End Settings Tab -->
        </UnderlineTabs.Root>
      {:else if lessonApi.lesson && !isMaterialsEmpty}
        {#key lessonId}
          <div class="mb-20 flex w-full flex-col gap-2" in:fade={{ delay: 500 }} out:fade>
            {#if !hasLessonVideos}
              <LessonMaterialActions showSummarize {lessonId} showSeparators={false} alignWithNote />
            {/if}

            {#each viewModeComponents as Component, index (index)}
              <Component {mode} {lessonId} {courseId} />
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
          {#if !$isOrgStudent}
            <Button onclick={toggleMode}>
              {$t('course.navItem.lessons.materials.get_started')}
            </Button>
          {/if}
        </Empty>
      {/if}
    </div>
  {/snippet}
</Page.Body>

<UnsavedChanges bind:hasUnsavedChanges />

{#if isVersionDrawerOpen && window.innerWidth >= 1024}
  <LessonVersionHistory
    open={isVersionDrawerOpen}
    on:close={() => (isVersionDrawerOpen = false)}
    on:restore={refetchDataAfterVersionRestore}
  />
{/if}
