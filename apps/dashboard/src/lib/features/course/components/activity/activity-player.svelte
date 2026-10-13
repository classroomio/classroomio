<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Alert from '@cio/ui/base/alert';
  import { Empty } from '@cio/ui/custom/empty';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
  import MaximizeIcon from '@lucide/svelte/icons/maximize';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import PackageIcon from '@lucide/svelte/icons/package';
  import { ContentType } from '@cio/utils/constants/content';
  import { activityApi, courseApi } from '$features/course/api';
  import ContentNavigationActions from '$features/course/components/lesson/content-navigation-actions.svelte';
  import StudentContentLockedNotice from '$features/course/components/student-content-locked-notice.svelte';
  import ActivityPlayerModuleMenu from '$features/course/components/activity/activity-player-module-menu.svelte';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { getCourseProgress, getOrderedNavigableContent, getContentRoute } from '$features/course/utils/content';
  import { isCourseMobileBottomNavVisible } from '$features/course/utils/mobile-bottom-nav';
  import { openCourseCompletionIfDone } from '$features/course/utils/toggle-lesson-completion';
  import { isTrustedPlayerMessage, parsePlayerMessage } from '$features/course/utils/scorm-utils';
  import { currentOrg } from '$lib/utils/store/org';
  import { isCourseLearnerView } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    activityId: string;
  }

  let { courseId, activityId }: Props = $props();

  let launchedFor = $state('');
  let currentUnitIdentifier = $state<string | null>(null);
  let displayedPlayerUrl = $state<string | null>(null);
  let playerReady = $state(false);
  let terminated = $state(false);
  let didNotConnect = $state(false);
  let requestingAttempt = $state(false);
  let retakesUnavailable = $state(false);
  let isFullscreen = $state(false);
  let now = $state(Date.now());
  let frameWrap = $state<HTMLElement | null>(null);
  let expiryTimer: ReturnType<typeof setInterval> | null = null;

  const launch = $derived(activityApi.launchResult);
  const availableLaunch = $derived(launch && launch.available ? launch : null);
  const isArchivedReview = $derived(
    Boolean(
      availableLaunch &&
        'reviewOfArchivedVersion' in availableLaunch &&
        (availableLaunch as { reviewOfArchivedVersion?: boolean }).reviewOfArchivedVersion
    )
  );
  const wasRestarted = $derived(
    Boolean(
      availableLaunch &&
        'restartedAfterReplace' in availableLaunch &&
        (availableLaunch as { restartedAfterReplace?: boolean }).restartedAfterReplace
    )
  );
  const playerUrl = $derived(availableLaunch?.playerUrl ?? null);
  const units = $derived(availableLaunch?.units ?? []);
  const showMenu = $derived(units.length > 1);
  const launchMode = $derived(
    activityApi.editor && activityApi.editor.available ? activityApi.editor.settings.launchMode : 'embedded'
  );
  const useNewWindow = $derived(launchMode === 'window' && !isMobileStore.current);

  const lockReason = $derived(
    $isCourseLearnerView ? getStudentContentLockReason(courseApi.course, activityId, ContentType.Activity) : null
  );

  const expired = $derived.by(() => {
    if (!availableLaunch) return false;

    return new Date(availableLaunch.expiresAt).getTime() <= now;
  });

  const activityComplete = $derived.by(() => {
    const item = getOrderedNavigableContent(courseApi.course).find(
      (entry) => entry.type === ContentType.Activity && entry.id === activityId
    );

    return item?.isComplete ?? false;
  });

  const pill = $derived.by(() => {
    if (activityComplete) return 'completed';
    if (availableLaunch?.mode === 'review') return 'review';
    if ((availableLaunch?.units ?? []).some((unit) => !unit.completed && unit.scorePercent !== null)) {
      return 'not_passed';
    }

    return 'in_progress';
  });

  const pillLabel = $derived(`course.navItem.lessons.activities.player.status_${pill}`);

  const modulesComplete = $derived.by(() => {
    if (!availableLaunch) return false;

    return availableLaunch.units.length > 0 && availableLaunch.units.every((unit) => unit.completed);
  });

  const currentUnit = $derived(
    availableLaunch?.units.find((unit) => unit.identifier === currentUnitIdentifier) ?? null
  );
  const showModuleCompleteCallout = $derived(terminated || (currentUnit?.completed ?? false));

  const nextCourseItem = $derived.by(() => {
    const items = getOrderedNavigableContent(courseApi.course);
    const index = items.findIndex((entry) => entry.type === ContentType.Activity && entry.id === activityId);

    return index === -1 ? null : (items[index + 1] ?? null);
  });

  const showMobileBottomNav = $derived(
    isCourseMobileBottomNavVisible({
      isCourseLearnerView: $isCourseLearnerView,
      isMobile: isMobileStore.current,
      isContentPage: true,
      courseProgress: getCourseProgress(courseApi.course)
    })
  );

  const instructions = $derived((activityApi.activity?.instructions as string | null) ?? null);

  async function runLaunch(input: { unitIdentifier?: string; newAttempt?: boolean }) {
    launchedFor = `${courseId}:${activityId}`;
    playerReady = false;
    terminated = false;
    didNotConnect = false;
    retakesUnavailable = false;
    const result = await activityApi.launch(courseId, activityId, input);

    if (result && result.available) {
      currentUnitIdentifier = result.unit.identifier;
      displayedPlayerUrl = result.playerUrl;
    }

    return result;
  }

  async function refreshProgressAndMaybeComplete() {
    const profileId = $profile.id;
    if (!profileId) return;

    await courseApi.refreshCourse(courseId, profileId);
    const item = getOrderedNavigableContent(courseApi.course).find(
      (entry) => entry.type === ContentType.Activity && entry.id === activityId
    );

    if (item?.isComplete) await openCourseCompletionIfDone(courseId);
  }

  async function handleTerminated(navRequest: string | null) {
    terminated = true;
    playerReady = false;
    await refreshProgressAndMaybeComplete();
    await activityApi.launch(courseId, activityId, {});

    if (navRequest === 'continue') {
      const nextIncomplete = nextIncompleteModule();
      if (nextIncomplete && nextIncomplete.identifier !== currentUnitIdentifier) {
        await selectUnit(nextIncomplete.identifier);
      }
    }
  }

  function handleMessage(event: MessageEvent) {
    const url = availableLaunch?.playerUrl ?? null;
    if (!url || !isTrustedPlayerMessage(event.origin, url)) return;

    const message = parsePlayerMessage(event.data);
    if (!message) return;

    if (message.type === 'ready') playerReady = true;
    else if (message.type === 'did-not-connect') didNotConnect = true;
    else void handleTerminated(message.navRequest);
  }

  function onFullscreenChange() {
    isFullscreen = Boolean(document.fullscreenElement);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }

    if (frameWrap) await frameWrap.requestFullscreen().catch(() => {});
  }

  async function selectUnit(identifier: string) {
    if (identifier === currentUnitIdentifier && playerReady && !terminated) return;

    currentUnitIdentifier = identifier;
    await runLaunch({ unitIdentifier: identifier });
  }

  function nextIncompleteModule() {
    const list = availableLaunch?.units ?? [];
    const currentIndex = list.findIndex((unit) => unit.identifier === currentUnitIdentifier);

    for (let index = currentIndex + 1; index < list.length; index += 1) {
      const unit = list[index];

      if (unit && !unit.completed) return unit;
    }

    return list.find((unit) => !unit.completed) ?? null;
  }

  async function reloadPlayer() {
    await runLaunch(currentUnitIdentifier ? { unitIdentifier: currentUnitIdentifier } : {});
  }

  async function startNewAttempt() {
    requestingAttempt = true;
    try {
      const result = await activityApi.launch(courseId, activityId, { newAttempt: true });

      if (result && result.available && result.mode === 'normal') {
        currentUnitIdentifier = result.unit.identifier;
        displayedPlayerUrl = result.playerUrl;
        playerReady = false;
        terminated = false;
        didNotConnect = false;
        retakesUnavailable = false;
      } else {
        retakesUnavailable = true;
      }
    } finally {
      requestingAttempt = false;
    }
  }

  function openInNewWindow() {
    if (!playerUrl) return;

    window.open(playerUrl, '_blank', 'noopener');
  }

  function goToNextCourseItem() {
    if (!nextCourseItem) return;

    const courseIdResolved = courseApi.course?.id;
    if (!courseIdResolved) return;
    const path = getContentRoute(courseIdResolved, nextCourseItem);
    if (!path) return;
    goto(resolve(path, {}));
  }

  onMount(() => {
    window.addEventListener('message', handleMessage);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    const onVisible = () => {
      now = Date.now();
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    expiryTimer = setInterval(() => {
      now = Date.now();
    }, 30_000);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      if (expiryTimer) clearInterval(expiryTimer);
    };
  });

  onDestroy(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  });

  $effect(() => {
    const organizationId = $currentOrg.id;
    const profileId = $profile.id;
    if (!organizationId || !profileId || !courseId || !activityId) return;
    if (lockReason) return;
    if (launchedFor === `${courseId}:${activityId}`) return;

    void courseApi.refreshCourse(courseId, profileId);
    void runLaunch({});
  });
</script>

<div class="mb-20 flex w-full flex-col gap-4 pb-10">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <ContentNavigationActions {courseId} {activityId} showPrevNext={!showMobileBottomNav} />
    {#if availableLaunch}
      <Badge variant={pill === 'completed' ? 'default' : 'secondary'}>{$t(pillLabel)}</Badge>
    {/if}
  </div>

  {#if lockReason}
    <StudentContentLockedNotice reason={lockReason} contentType={ContentType.Activity} />
  {:else if activityApi.launching && !launch}
    <Skeleton class="aspect-video w-full" />
  {:else if !launch}
    <Alert.Root variant="destructive">
      <Alert.Title>{$t('course.navItem.lessons.activities.player.load_failed_title')}</Alert.Title>
      <Alert.Description>{$t('course.navItem.lessons.activities.player.load_failed_body')}</Alert.Description>
      <div class="mt-3">
        <Button size="sm" variant="outline" onclick={reloadPlayer}>
          {$t('course.navItem.lessons.activities.player.reload')}
        </Button>
      </div>
    </Alert.Root>
  {:else if !launch.available}
    <Empty
      title={$t('course.navItem.lessons.activities.not_available_title')}
      description={$t('course.navItem.lessons.activities.not_available_description')}
      icon={PackageIcon}
      variant="page"
    />
  {:else if expired}
    <Empty
      title={$t('course.navItem.lessons.activities.player.expired_title')}
      description={$t('course.navItem.lessons.activities.player.expired_body')}
      icon={PackageIcon}
      variant="page"
    />
    <div class="flex justify-center">
      <Button size="sm" onclick={reloadPlayer}>{$t('course.navItem.lessons.activities.player.reload')}</Button>
    </div>
  {:else}
    {#if instructions}
      <div class="ui:text-muted-foreground text-sm">{@html instructions}</div>
    {/if}

    {#if isArchivedReview}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.archived_title')}</Alert.Title>
        <Alert.Description>{$t('course.navItem.lessons.activities.player.archived_body')}</Alert.Description>
      </Alert.Root>
    {/if}

    {#if wasRestarted}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.restarted_title')}</Alert.Title>
        <Alert.Description>{$t('course.navItem.lessons.activities.player.restarted_body')}</Alert.Description>
      </Alert.Root>
    {/if}

    {#if launch.mode === 'review'}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.review_title')}</Alert.Title>
        <Alert.Description>{$t('course.navItem.lessons.activities.player.review_body')}</Alert.Description>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onclick={startNewAttempt} loading={requestingAttempt}>
            {$t('course.navItem.lessons.activities.player.new_attempt')}
          </Button>
          {#if retakesUnavailable}
            <span class="ui:text-muted-foreground text-sm">
              {$t('course.navItem.lessons.activities.player.retakes_off')}
            </span>
          {/if}
        </div>
      </Alert.Root>
    {/if}

    {#if showMenu && launch.units}
      <ActivityPlayerModuleMenu
        units={launch.units}
        currentIdentifier={currentUnitIdentifier}
        onSelect={(identifier) => void selectUnit(identifier)}
      />
    {/if}

    {#if useNewWindow}
      <Empty
        title={$t('course.navItem.lessons.activities.player.window_title')}
        description={$t('course.navItem.lessons.activities.player.window_body')}
        icon={PackageIcon}
        variant="page"
      />
      <div class="flex justify-center">
        <Button size="sm" onclick={openInNewWindow}>
          {$t('course.navItem.lessons.activities.player.open_window')}
        </Button>
      </div>
    {:else}
      <div bind:this={frameWrap} class="ui:bg-background relative w-full overflow-hidden rounded-lg border">
        {#if displayedPlayerUrl}
          {#key displayedPlayerUrl}
            <iframe
              src={displayedPlayerUrl}
              title={activityApi.activity?.title ?? ''}
              class="aspect-video w-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              data-testid="activity-player-frame"
            ></iframe>
          {/key}
          {#if !playerReady && !didNotConnect && !terminated}
            <Skeleton class="absolute inset-0 aspect-video w-full" />
          {/if}
        {:else}
          <Skeleton class="aspect-video w-full" />
        {/if}
        {#if didNotConnect}
          <div class="flex flex-col items-center gap-3 p-8 text-center">
            <p class="text-sm font-medium">{$t('course.navItem.lessons.activities.player.no_connection_title')}</p>
            <p class="ui:text-muted-foreground text-sm">
              {$t('course.navItem.lessons.activities.player.no_connection_body')}
            </p>
            <Button size="sm" variant="outline" onclick={reloadPlayer}>
              {$t('course.navItem.lessons.activities.player.reload')}
            </Button>
          </div>
        {/if}
      </div>
      <div class="flex items-center justify-between gap-2">
        <span class="ui:text-muted-foreground text-xs">
          {$t('course.navItem.lessons.activities.player.autosave_hint')}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onclick={toggleFullscreen}
          aria-label={$t('course.navItem.lessons.activities.player.fullscreen')}
        >
          {#if isFullscreen}
            <MinimizeIcon size={14} />
          {:else}
            <MaximizeIcon size={14} />
          {/if}
        </Button>
      </div>
    {/if}

    {#if modulesComplete}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.complete_title')}</Alert.Title>
        <Alert.Description>{$t('course.navItem.lessons.activities.player.complete_body')}</Alert.Description>
        {#if nextCourseItem}
          <div class="mt-3">
            <Button size="sm" onclick={goToNextCourseItem}>
              {$t('course.navItem.lessons.activities.player.continue')}
            </Button>
          </div>
        {/if}
      </Alert.Root>
    {:else if showModuleCompleteCallout}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.module_complete_title')}</Alert.Title>
        <Alert.Description>{$t('course.navItem.lessons.activities.player.module_complete_body')}</Alert.Description>
        <div class="mt-3">
          <Button
            size="sm"
            onclick={() => {
              const next = nextIncompleteModule();
              if (next) void selectUnit(next.identifier);
            }}
          >
            {$t('course.navItem.lessons.activities.player.next_module')}
          </Button>
        </div>
      </Alert.Root>
    {/if}
  {/if}
</div>
