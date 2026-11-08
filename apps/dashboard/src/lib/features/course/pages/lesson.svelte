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
  import Eye from '@lucide/svelte/icons/eye';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Save from '@lucide/svelte/icons/save';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import VideoIcon from '@lucide/svelte/icons/video';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  import MODES from '$lib/utils/constants/mode';
  import { profile } from '$lib/utils/store/user';
  import { isCourseLearnerView, isStudentExperience } from '$lib/utils/store/app';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import { getCourseProgress } from '$features/course/utils/content';
  import { isCourseMobileBottomNavVisible } from '$features/course/utils/mobile-bottom-nav';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import { RefreshPageData, UnsavedChanges } from '$features/ui';
  import LessonVersionHistory from '$features/course/components/lesson/lesson-version-history.svelte';
  import { courseApi, lessonApi } from '$features/course/api';
  import { lessonBlockList } from '$features/course/store/lesson-blocks.svelte';
  import { createLessonBlockOwner } from '$features/course/utils/lesson-block-owner';
  import LessonBlocks from '$features/course/components/lesson/lesson-blocks.svelte';
  import LessonSettingsSheet from '$features/course/components/lesson/lesson-settings-sheet.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonVideoUpload, lessonDocUpload } from '$features/course/components/lesson/store';
  import { lessonVideoBus } from '$features/course/components/lesson/video/lesson-video-bus.svelte';
  import { TRANSCRIPT_PANEL_ID } from '$features/course/components/lesson/video/transcript-panel-definition';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import { ContentType } from '@cio/utils/constants/content';
  import { resolveLessonSlides } from '@cio/utils/functions';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import { Chip } from '@cio/ui/custom/chip';
  import * as Page from '@cio/ui/base/page';
  import * as Tabs from '@cio/ui/base/tabs';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Block from '@cio/ui/custom/block';
  import { Spinner } from '@cio/ui/base/spinner';
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

  import type { TLessonVersionIntentRequest } from '@cio/utils/validation/lesson';
  import type { TLocale } from '@cio/db/types';
  import { orderedTabs, SETTINGS_TAB_VALUE, tabs as materialTabs } from '$features/course/components/lesson/constants';
  import { getViewModeComponents } from '$features/course/components/lesson/utils';
  import { loadDraft, clearDraft } from '$features/course/utils/lesson-draft';
  import {
    DEFAULT_READING_DENSITY,
    getReadingDensitySpacingClass
  } from '$features/course/utils/lesson-reading-density';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import StudentContentLockedNotice from '$features/course/components/student-content-locked-notice.svelte';
  import LiveSessionCard from '$features/course/components/lesson/live-session-card.svelte';
  import { liveSessionClock } from '$features/course/utils/live-session-phase';
  import { getLiveSessionPhase, type LiveSessionPhase } from '@cio/utils/functions/live-session';

  interface Props {
    courseId: string;
    lessonId: string;
  }

  let { courseId, lessonId }: Props = $props();

  const mode = $derived($page.url.searchParams.get('mode') === 'edit' ? MODES.edit : MODES.view);
  const useBlockEditor = $derived($page.url.searchParams.get('editor') !== 'legacy');
  const showMobileBottomNav = $derived(
    isCourseMobileBottomNavVisible({
      isCourseLearnerView: $isCourseLearnerView,
      isMobile: isMobileStore.current,
      isLessonOrExercisePage: true,
      courseProgress: getCourseProgress(courseApi.course)
    })
  );

  const HISTORY_PARAM = 'history';
  const VERSION_PARAM = 'version';

  let prevModeParam = $state<string | null>(null);
  let settingsOpen = $state(false);
  let blockListLessonId = '';
  // Derived from the URL so a reload reopens the drawer. The URL is the single source of
  // truth; nothing sets this directly.
  const isVersionDrawerOpen = $derived($page.url.searchParams.get(HISTORY_PARAM) === 'open');
  // eslint-disable-next-line svelte/prefer-writable-derived -- must be writable: cleared before intentional navigations and bound to UnsavedChanges
  let hasUnsavedChanges = $state(false);
  let sessionHasUnsavedChanges = $state(false);

  $effect(() => {
    hasUnsavedChanges = (lessonApi.isDirty || sessionHasUnsavedChanges) && mode === MODES.edit;
  });

  $effect(() => {
    if (!useBlockEditor) return;

    const lesson = lessonApi.lesson;
    if (!lesson || lesson.id !== lessonId || blockListLessonId === lessonId) return;

    blockListLessonId = lessonId;
    void lessonBlockList.load(createLessonBlockOwner(courseId, lessonId));
  });

  $effect(() => {
    if (!useBlockEditor) return;

    const lesson = lessonApi.lesson;
    if (!lesson || lesson.id !== lessonId || !Array.isArray(lesson.blocks)) return;

    lessonBlockList.syncFromPayload(lesson.blocks.map((block) => block.id));
  });

  const currentLessonContentItem = $derived(
    getOrderedNavigableContent(courseApi.course).find(
      (item) => item.type === ContentType.Lesson && item.id === lessonId
    )
  );
  const lessonTitle = $derived(currentLessonContentItem?.title || lessonApi.lesson?.title || 'Lesson');
  const showLessonComments = $derived(
    Boolean($currentOrg.customization?.apps?.comments) &&
      (courseApi.course?.metadata?.commentsEnabled ?? true) &&
      (lessonApi.lesson?.commentsEnabled ?? true)
  );
  const contentLockReason = $derived(getStudentContentLockReason(courseApi.course, lessonId, ContentType.Lesson));
  const isStudentLessonStateReady = $derived.by(() => {
    if (!$isCourseLearnerView) {
      return true;
    }

    if (courseApi.course?.id !== courseId) {
      return false;
    }

    if (contentLockReason !== null) {
      return true;
    }

    if (currentLessonContentItem) {
      return true;
    }

    if (lessonApi.lesson?.id === lessonId) {
      return true;
    }

    return courseApi.course?.content != null;
  });
  const isPublicCourse = $derived(courseApi.course?.type === 'PUBLIC');
  const isLiveSessionLesson = $derived(Boolean(lessonApi.lesson?.callUrl && lessonApi.lesson?.lessonAt));
  const lessonSessionPhase = $derived(
    lessonApi.lesson?.id === lessonId ? getLiveSessionPhase(lessonApi.lesson, $liveSessionClock) : null
  );
  let observedSessionPhase: { lessonId: string; phase: LiveSessionPhase | null } | null = null;

  $effect(() => {
    const phase = lessonSessionPhase;
    const previous = observedSessionPhase;
    observedSessionPhase = { lessonId, phase };
    const sessionJustEnded =
      phase === 'ended' && previous?.lessonId === lessonId && previous.phase !== null && previous.phase !== 'ended';
    if (!sessionJustEnded || !$isStudentExperience) return;

    void lessonApi.get(courseId, lessonId);
  });

  function setModeQueryParam(value: (typeof MODES)[keyof typeof MODES]) {
    const params = new SvelteURLSearchParams($page.url.searchParams);
    params.set('mode', value);
    goto(resolve(`${$page.url.pathname}?${params.toString()}`, {}), { replaceState: false });
  }
  /** Closing drops the selected version too, so both params move in one navigation. */
  function setHistoryQueryParam(isOpen: boolean) {
    const params = new SvelteURLSearchParams($page.url.searchParams);

    if (isOpen) {
      params.set(HISTORY_PARAM, 'open');
    } else {
      params.delete(HISTORY_PARAM);
      params.delete(VERSION_PARAM);
    }

    const query = params.toString();
    return goto(resolve(query ? `${$page.url.pathname}?${query}` : $page.url.pathname, {}), { replaceState: false });
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
      queueSave('manual');
    }
    if (!sessionHasUnsavedChanges) hasUnsavedChanges = false;
    setModeQueryParam(mode === MODES.edit ? MODES.view : MODES.edit);
  }

  const refetchDataAfterVersionRestore = async () => {
    await setHistoryQueryParam(false);

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

    const slides = resolveLessonSlides(lessonApi.lesson?.slides, lessonApi.lesson?.slideUrl);
    const videos = lessonApi.lesson?.videos || [];
    const documents = lessonApi.lesson?.documents || [];

    return ordered.map((tab) => {
      if (tab.value === 1) {
        tab.badgeValue = isHtmlValueEmpty(content) ? 0 : 1;
      } else if (tab.value === 2) {
        tab.badgeValue = slides.length;
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
  const hasLessonBlocks = $derived(lessonBlockList.blocks.length > 0);
  const usesBlockView = $derived(
    useBlockEditor && (!$isCourseLearnerView || hasLessonBlocks || !lessonBlockList.isReady)
  );
  const hasTranscript = $derived.by(() => {
    lessonVideoBus.transcriptSources;
    return lessonVideoBus.hasTranscriptAvailable();
  });
  // Image blocks have no legacy equivalent, so they render straight from the block list.
  const learnerImageBlocks = $derived.by(() => {
    const blocks = lessonApi.lesson?.blocks ?? [];

    return blocks
      .filter((block) => block.type === 'image')
      .map((block) => {
        const data = block.data as { url?: string; alt?: string; fit?: 'cover' | 'contain' };

        return {
          id: block.id,
          url: data.url ?? '',
          alt: data.alt ?? '',
          fit: data.fit ?? 'cover'
        };
      })
      .filter((block) => block.url.length > 0);
  });

  let timeoutId: NodeJS.Timeout | undefined;

  // Saves run one at a time: clearing the debounce only cancels a save that has
  // not started, so an in-flight autosave could still land after a manual one.
  let saveQueue: Promise<unknown> = Promise.resolve();

  function queueSave(versionIntent: TLessonVersionIntentRequest) {
    saveQueue = saveQueue.catch(() => undefined).then(() => saveLesson(versionIntent));

    return saveQueue;
  }

  let isLoading = writable(false);

  function callAI(_type = '') {}

  const getValue = (label: string) => {
    const tabValue = tabs.find((tab) => tab.label === label)?.value;
    return tabValue;
  };

  async function saveOrUpdateTranslation(
    locale: TLocale,
    lessonId: string,
    versionIntent: TLessonVersionIntentRequest
  ) {
    if (!courseApi.course?.id) return;

    if (useBlockEditor) {
      return;
    }

    const content = lessonApi.translations[lessonId]?.[locale] || '';

    // The legacy language endpoint stores content on the first note block and
    // creates one when missing. Saving an empty translation must not add a note
    // the author never created.
    const hasNoteBlock = lessonBlockList.blocks.some((block) => block.type === 'note');
    if (!hasNoteBlock && isHtmlValueEmpty(content)) return;

    // Use API to upsert lesson language (creates if doesn't exist, updates if exists)
    await lessonApi.upsertLanguage(courseApi.course.id, lessonId, locale, content, versionIntent);
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

    const title = lessonApi.lesson.title;
    courseApi.updateContentItem(lessonApi.lesson.id, ContentType.Lesson, {
      ...(title ? { title } : {}),
      isUnlocked: lessonApi.lesson.isUnlocked ?? null,
      hasNoteContent: hasLessonNoteContent(lessonApi.lesson.id),
      hasSlideContent: resolveLessonSlides(lessonApi.lesson.slides, lessonApi.lesson.slideUrl).length > 0,
      videosCount: Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0,
      documentsCount: Array.isArray(lessonApi.lesson.documents) ? lessonApi.lesson.documents.length : 0
    });
  }

  async function saveLesson(versionIntent: TLessonVersionIntentRequest = 'auto') {
    if (!lessonApi.lesson) return false;

    const revisionAtSave = lessonApi.revision;
    // Block content is owned by the block API, so the legacy content arrays are
    // left out here: sending them makes the API reconcile blocks against a payload
    // that cannot represent repeats or ordering.
    const legacyContent = useBlockEditor
      ? {}
      : {
          slideUrl: lessonApi.lesson.slideUrl || undefined,
          slides: lessonApi.lesson.slides || [],
          videos: lessonApi.lesson.videos || [],
          documents: lessonApi.lesson.documents || []
        };
    const [isLessonUpdated] = await Promise.all([
      lessonApi.update(courseApi.course?.id || '', lessonId, {
        title: lessonApi.lesson.title || undefined,
        isUnlocked: lessonApi.lesson.isUnlocked ?? undefined,
        completionPolicy: lessonApi.lesson.completionPolicy ?? undefined,
        videoWatchThreshold: lessonApi.lesson.videoWatchThreshold ?? undefined,
        commentsEnabled: lessonApi.lesson.commentsEnabled ?? true,
        readingDensity: lessonApi.lesson.readingDensity ?? undefined,
        ...legacyContent,
        slug: isPublicCourse && lessonApi.lesson.slug ? lessonApi.lesson.slug : undefined
      }),
      saveOrUpdateTranslation(lessonApi.currentLocale, lessonId, versionIntent)
    ]);

    if (isLessonUpdated && revisionAtSave === lessonApi.revision) {
      patchLessonListItemLocally();
      clearDraft(lessonId, lessonApi.currentLocale);
      lessonApi.isDirty = false;
    } else if (revisionAtSave !== lessonApi.revision) {
      autoSave();
    }
  }

  function handleLessonTitleChange(value: string) {
    lessonApi.updateLessonState('title', value);
  }

  function openTranscriptPanel() {
    if (!lessonVideoBus.prepareTranscriptPanelSelection()) return;

    sidePanel.open(TRANSCRIPT_PANEL_ID);
  }

  function handleToggleLessonLock() {
    const currentValue = lessonApi.lesson?.isUnlocked ?? false;
    lessonApi.updateLessonState('isUnlocked', !currentValue);
  }

  function handleSave(prevMode: string) {
    untrack(() => {
      if (prevMode === MODES.edit) {
        void lessonBlockList.flush();
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = undefined;
        queueSave('manual');
      }
    });
  }

  function autoSave() {
    if (mode === MODES.view) return;
    if (!lessonApi.isDirty) return;

    if (timeoutId) clearTimeout(timeoutId);

    untrack(() => {
      timeoutId = setTimeout(() => {
        void queueSave('auto');
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
      lessonApi.markDirty();
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

{#if !useBlockEditor}
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
{/if}

<Page.Header
  isSticky
  class="ui:top-12 ui:z-app-bar ui:my-0 ui:border-border ui:bg-background ui:pt-5 ui:pb-4 flex-start w-full border-b"
>
  <Page.HeaderContent class="min-w-0 flex-1">
    <LessonPageEditHeader
      {mode}
      title={mode === MODES.edit ? (lessonApi.lesson?.title ?? '') : lessonTitle}
      isUnlocked={lessonApi.lesson?.isUnlocked ?? false}
      onTitleChange={handleLessonTitleChange}
      onToggleLock={handleToggleLessonLock}
    />
  </Page.HeaderContent>
  <Page.Action class="">
    <div class="flex flex-wrap items-center justify-center gap-2">
      {#if mode === MODES.view && $isCourseLearnerView}
        <ContentNavigationActions {lessonId} {courseId} showPrevNext={!showMobileBottomNav} />
      {/if}

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if mode === MODES.edit}
          <span class="ui:text-muted-foreground text-sm" aria-live="polite">
            {#if lessonApi.isSaving}
              {$t('course.navItem.lessons.saving')}
            {:else if !lessonApi.isDirty}
              {$t('course.navItem.lessons.saved')}
            {/if}
          </span>

          <IconButton
            onclick={toggleMode}
            disabled={lessonApi.isSaving}
            aria-label={$t('course.navItem.lessons.add_lesson.save')}
            tooltip={$t('course.navItem.lessons.add_lesson.save')}
            tooltipSide="bottom"
          >
            <Save size={20} />
          </IconButton>
        {/if}

        {#if useBlockEditor && mode === MODES.edit}
          <IconButton
            onclick={() => (settingsOpen = true)}
            aria-label={$t('course.navItem.lessons.materials.blocks.settings.title')}
            tooltip={$t('course.navItem.lessons.materials.blocks.settings.title')}
            tooltipSide="bottom"
          >
            <SettingsIcon size={20} />
          </IconButton>
        {/if}

        <IconButton
          class="inline-flex"
          onclick={() => setHistoryQueryParam(true)}
          aria-label={$t('course.navItem.lessons.version_history.title')}
          tooltip={$t('course.navItem.lessons.version_history.title')}
          tooltipSide="bottom"
        >
          <HistoryIcon size={20} />
        </IconButton>

        <div class="hidden lg:inline-flex">
          <RefreshPageData onRefresh={() => lessonApi.get(courseId, lessonId)} />
        </div>
      </RoleBasedSecurity>

      <LanguageSelector />

      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <Tabs.Root
          value={mode}
          onValueChange={(next) => {
            if (next !== mode) toggleMode();
          }}
        >
          <Tabs.List aria-label={$t('course.navItem.lessons.header.mode_label')}>
            <Tabs.Trigger value={MODES.edit} disabled={lessonApi.isSaving} data-testid="lesson-mode-edit">
              <Pencil />
              {$t('course.navItem.lessons.header.mode_edit')}
            </Tabs.Trigger>
            <Tabs.Trigger value={MODES.view} disabled={lessonApi.isSaving} data-testid="lesson-mode-preview">
              <Eye />
              {$t('course.navItem.lessons.header.mode_preview')}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </RoleBasedSecurity>
    </div>
  </Page.Action>
</Page.Header>

<Page.Body class="mx-auto w-full max-w-full pb-0! md:max-w-3xl">
  {#snippet child()}
    <div class={`w-full overflow-x-hidden ${mode === MODES.edit ? 'ui:bg-muted' : 'mx-auto'}`}>
      {#if isLiveSessionLesson && mode === MODES.view && !($isCourseLearnerView && contentLockReason)}
        <div class="mb-4">
          <LiveSessionCard
            title={lessonTitle}
            callUrl={lessonApi.lesson?.callUrl ?? ''}
            lessonAt={lessonApi.lesson?.lessonAt ?? ''}
            timezone={courseApi.course?.metadata?.sessionTimezone}
            durationMinutes={lessonApi.lesson?.sessionDurationMinutes}
            recordingUrl={lessonApi.lesson?.recordingUrl}
          />
        </div>
      {/if}

      {#if usesBlockView}
        {#if $isCourseLearnerView && !isStudentLessonStateReady}
          <div class="flex justify-center py-16">
            <Spinner />
          </div>
        {:else if $isCourseLearnerView && contentLockReason}
          <StudentContentLockedNotice reason={contentLockReason} contentType={ContentType.Lesson} />
        {:else if lessonApi.lesson && lessonBlockList.isReady}
          <div class="min-h-screen pt-5 pb-20" in:fade={{ delay: 300 }} out:fade>
            <LessonBlocks {mode} {courseId} {lessonId} learnerView={$isCourseLearnerView} />

            {#if mode === MODES.view}
              <LessonMaterialActions
                showTranscript={hasTranscript}
                showSummarize
                {lessonId}
                showBottomSeparator={!showLessonComments}
                onTranscript={openTranscriptPanel}
              />
            {/if}

            {#if mode === MODES.view && showLessonComments}
              <hr class="my-2" />

              <Comments {lessonId} />
            {/if}
          </div>
        {:else}
          <div class="flex justify-center py-16">
            <Spinner />
          </div>
        {/if}
      {:else if $isCourseLearnerView}
        {#if !isStudentLessonStateReady}
          <div class="flex justify-center py-16">
            <Spinner />
          </div>
        {:else if contentLockReason}
          <StudentContentLockedNotice reason={contentLockReason} contentType={ContentType.Lesson} />
        {:else if lessonApi.lesson && !isMaterialsEmpty}
          {#key lessonId}
            <div
              class="flex w-full flex-col pt-6 pb-20 {getReadingDensitySpacingClass(
                lessonApi.lesson.readingDensity ?? DEFAULT_READING_DENSITY
              )}"
              in:fade={{ delay: 500 }}
              out:fade
            >
              {#each viewModeComponents as Component, index (index)}
                <Component {mode} {lessonId} {courseId} />
              {/each}

              {#each learnerImageBlocks as block (block.id)}
                <Block.Image url={block.url} alt={block.alt} fit={block.fit} editable={false} />
              {/each}

              {#if !hasLessonVideos}
                <LessonMaterialActions showSummarize {lessonId} showBottomSeparator={!showLessonComments} />
              {/if}

              {#if showLessonComments}
                <hr class="my-2" />

                <Comments {lessonId} />
              {/if}
            </div>
          {/key}
        {:else}
          <div class="ui:mt:5">
            <Empty
              title={$t('course.navItem.lessons.materials.no_content')}
              icon={VideoIcon}
              variant="page"
              class="text-center"
            />
          </div>
        {/if}
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
            <LessonSettingsTab bind:hasUnsavedSessionChanges={sessionHasUnsavedChanges} />
          </UnderlineTabs.Content>
          <!-- End Settings Tab -->
        </UnderlineTabs.Root>
      {:else if lessonApi.lesson && !isMaterialsEmpty}
        {#key lessonId}
          <div class="mb-20 flex w-full flex-col" in:fade={{ delay: 500 }} out:fade>
            {#each viewModeComponents as Component, index (index)}
              <Component {mode} {lessonId} {courseId} />
            {/each}

            {#if !hasLessonVideos}
              <LessonMaterialActions showSummarize {lessonId} showBottomSeparator={!showLessonComments} />
            {/if}

            {#if showLessonComments}
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

<UnsavedChanges bind:hasUnsavedChanges />

{#if useBlockEditor}
  <LessonSettingsSheet bind:open={settingsOpen} bind:hasUnsavedSessionChanges={sessionHasUnsavedChanges} />
{/if}

{#if isVersionDrawerOpen}
  <LessonVersionHistory
    open={isVersionDrawerOpen}
    on:close={() => setHistoryQueryParam(false)}
    on:restore={refetchDataAfterVersionRestore}
  />
{/if}
