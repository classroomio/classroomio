<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { resolve } from '$app/paths';
  import { untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import Save from '@lucide/svelte/icons/save';
  import HistoryIcon from '@lucide/svelte/icons/history';
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
  import LessonModeToggle from '$features/course/components/lesson/lesson-mode-toggle.svelte';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonVideoBus } from '$features/course/components/lesson/video/lesson-video-bus.svelte';
  import { TRANSCRIPT_PANEL_ID } from '$features/course/components/lesson/video/transcript-panel-definition';
  import { sidePanel } from '$features/side-panel';
  import { t } from '$lib/utils/functions/translations';
  import { ContentType } from '@cio/utils/constants/content';
  import { resolveLessonSlides } from '@cio/utils/functions';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import * as Page from '@cio/ui/base/page';
  import { Spinner } from '@cio/ui/base/spinner';
  import { RoleBasedSecurity } from '$features/ui';

  import {
    ContentNavigationActions,
    LessonPageEditHeader,
    Comments
    // LessonMaterialActions
  } from '$features/course/components/lesson';

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
    const lesson = lessonApi.lesson;
    if (!lesson || lesson.id !== lessonId || blockListLessonId === lessonId) return;

    blockListLessonId = lessonId;
    void lessonBlockList.load(createLessonBlockOwner(courseId, lessonId));
  });

  $effect(() => {
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

  function toggleMode() {
    if (mode === MODES.edit && lessonApi.isDirty) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = undefined;
      queueSave();
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

  const showBlockViewComments = $derived(
    mode === MODES.view &&
      showLessonComments &&
      !!lessonApi.lesson &&
      lessonBlockList.isReady &&
      !($isCourseLearnerView && (!isStudentLessonStateReady || contentLockReason))
  );
  const hasTranscript = $derived.by(() => {
    lessonVideoBus.transcriptSources;
    return lessonVideoBus.hasTranscriptAvailable();
  });
  let timeoutId: NodeJS.Timeout | undefined;

  // Saves run one at a time: clearing the debounce only cancels a save that has
  // not started, so an in-flight autosave could still land after a manual one.
  let saveQueue: Promise<unknown> = Promise.resolve();

  function queueSave() {
    saveQueue = saveQueue.catch(() => undefined).then(() => saveLesson());

    return saveQueue;
  }

  const canAutoSave = $derived(mode === MODES.edit || settingsOpen);

  function handleSettingsOpenChange(isOpen: boolean) {
    if (isOpen || mode === MODES.edit || !lessonApi.isDirty) return;

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = undefined;
    void queueSave();
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

  async function saveLesson() {
    if (!lessonApi.lesson) return false;

    const revisionAtSave = lessonApi.revision;
    const isLessonUpdated = await lessonApi.update(courseApi.course?.id || '', lessonId, {
      title: lessonApi.lesson.title || undefined,
      isUnlocked: lessonApi.lesson.isUnlocked ?? undefined,
      completionPolicy: lessonApi.lesson.completionPolicy ?? undefined,
      videoWatchThreshold: lessonApi.lesson.videoWatchThreshold ?? undefined,
      commentsEnabled: lessonApi.lesson.commentsEnabled ?? true,
      readingDensity: lessonApi.lesson.readingDensity ?? undefined,
      slug: isPublicCourse && lessonApi.lesson.slug ? lessonApi.lesson.slug : undefined
    });

    if (isLessonUpdated && revisionAtSave === lessonApi.revision) {
      patchLessonListItemLocally();
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

  function handleSave(prevMode: string) {
    untrack(() => {
      if (prevMode === MODES.edit) {
        void lessonBlockList.flush();
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = undefined;
        queueSave();
      }
    });
  }

  function autoSave() {
    if (!canAutoSave) return;
    if (!lessonApi.isDirty) return;

    if (timeoutId) clearTimeout(timeoutId);

    untrack(() => {
      timeoutId = setTimeout(() => {
        void queueSave();
      }, 2000);
    });
  }

  // Only autosave after real edits, not on every reactive update.
  $effect(() => {
    if (!canAutoSave) return;
    if (!lessonApi.lesson || !lessonId) return;
    if (!lessonApi.isDirty) return;

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

<Page.Header
  isSticky
  class="ui:top-12 ui:z-app-bar ui:my-0 ui:border-border ui:bg-background w-full border-b px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4"
>
  <div class="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3">
    <Page.HeaderContent class="min-w-52 flex-1">
      <LessonPageEditHeader
        {mode}
        title={mode === MODES.edit ? (lessonApi.lesson?.title ?? '') : lessonTitle}
        onTitleChange={handleLessonTitleChange}
      />
    </Page.HeaderContent>
    <Page.Action class="min-w-0">
      <div class="flex flex-wrap items-center gap-2 md:justify-end">
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

          <IconButton
            onclick={() => (settingsOpen = true)}
            aria-label={$t('course.navItem.lessons.materials.blocks.settings.title')}
            tooltip={$t('course.navItem.lessons.materials.blocks.settings.title')}
            tooltipSide="bottom"
          >
            <SettingsIcon size={20} />
          </IconButton>

          <IconButton
            class="inline-flex"
            onclick={() => setHistoryQueryParam(true)}
            aria-label={$t('course.navItem.lessons.version_history.title')}
            tooltip={$t('course.navItem.lessons.version_history.title')}
            tooltipSide="bottom"
          >
            <HistoryIcon size={20} />
          </IconButton>

          {#if mode === MODES.view}
            <div class="hidden lg:inline-flex">
              <RefreshPageData onRefresh={() => lessonApi.get(courseId, lessonId)} />
            </div>
          {/if}
        </RoleBasedSecurity>

        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <LessonModeToggle
            class="order-first md:order-none"
            {mode}
            disabled={lessonApi.isSaving}
            onToggle={toggleMode}
          />
        </RoleBasedSecurity>
      </div>
    </Page.Action>
  </div>
</Page.Header>

<Page.Body class="w-full gap-0 pb-0!">
  {#snippet child()}
    <div class="mx-auto w-full overflow-x-hidden md:max-w-[min(48rem,calc(100%-3rem))]">
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

      {#if $isCourseLearnerView && !isStudentLessonStateReady}
        <div class="flex justify-center py-16">
          <Spinner />
        </div>
      {:else if $isCourseLearnerView && contentLockReason}
        <StudentContentLockedNotice reason={contentLockReason} contentType={ContentType.Lesson} />
      {:else if lessonApi.lesson && lessonBlockList.isReady}
        <div class={['pt-5', showBlockViewComments ? 'pb-12' : 'min-h-screen pb-20']} in:fade={{ delay: 300 }} out:fade>
          <LessonBlocks {mode} {courseId} {lessonId} learnerView={$isCourseLearnerView} />

          <!-- {#if mode === MODES.view}
            <LessonMaterialActions
              showTranscript={hasTranscript}
              showSummarize
              {lessonId}
              showBottomSeparator={!showLessonComments}
              onTranscript={openTranscriptPanel}
            />
          {/if} -->
        </div>
      {:else}
        <div class="flex justify-center py-16">
          <Spinner />
        </div>
      {/if}
    </div>

    {#if showBlockViewComments}
      <div class="ui:border-border border-t">
        <div class="mx-auto w-full px-3 md:max-w-[min(48rem,calc(100%-3rem))] md:px-0">
          <Comments {lessonId} />
        </div>
      </div>
    {/if}
  {/snippet}
</Page.Body>

<UnsavedChanges bind:hasUnsavedChanges />

<LessonSettingsSheet
  bind:open={settingsOpen}
  bind:hasUnsavedSessionChanges={sessionHasUnsavedChanges}
  onOpenChange={handleSettingsOpenChange}
/>

{#if isVersionDrawerOpen}
  <LessonVersionHistory
    open={isVersionDrawerOpen}
    on:close={() => setHistoryQueryParam(false)}
    on:restore={refetchDataAfterVersionRestore}
  />
{/if}
