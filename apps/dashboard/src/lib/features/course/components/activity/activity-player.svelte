<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Alert from '@cio/ui/base/alert';
  import { Empty } from '@cio/ui/custom/empty';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import MaximizeIcon from '@lucide/svelte/icons/maximize';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import PackageIcon from '@lucide/svelte/icons/package';
  import { ContentType } from '@cio/utils/constants/content';
  import { activityApi, courseApi } from '$features/course/api';
  import StudentContentLockedNotice from '$features/course/components/student-content-locked-notice.svelte';
  import ActivityPlayerModuleNav from '$features/course/components/activity/activity-player-module-nav.svelte';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { getCourseProgress, getOrderedNavigableContent, getContentRoute } from '$features/course/utils/content';
  import { sanitizeHtml } from '$lib/utils/functions/sanitize-html';
  import { openCourseCompletionIfDone } from '$features/course/utils/toggle-lesson-completion';
  import { isTrustedPlayerMessage, parsePlayerMessage } from '$features/course/utils/scorm-utils';
  import { snackbar } from '$features/ui/snackbar/store';
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
  let isFocusMode = $state(false);
  let navVisible = $state(true);
  let isMenuOpen = $state(false);
  let now = $state(Date.now());
  let frameWrap = $state<HTMLElement | null>(null);
  let playerFrame = $state<HTMLIFrameElement | null>(null);
  let bootFailed = $state(false);
  let expiryTimer: ReturnType<typeof setInterval> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const isImmersive = $derived(isFullscreen || isFocusMode);

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
  const units = $derived(availableLaunch?.units ?? []);
  const showMenu = $derived(units.length > 1);
  const allowRetakes = $derived(
    activityApi.editor && activityApi.editor.available ? (activityApi.editor.settings.allowRetakes ?? false) : false
  );

  const lockReason = $derived(
    $isCourseLearnerView ? getStudentContentLockReason(courseApi.course, activityId, ContentType.Activity) : null
  );

  const expired = $derived.by(() => {
    if (!availableLaunch) return false;

    return new Date(availableLaunch.expiresAt).getTime() <= now;
  });

  const modulesComplete = $derived.by(() => {
    if (!availableLaunch) return false;

    return availableLaunch.units.length > 0 && availableLaunch.units.every((unit) => unit.completed);
  });

  const nextCourseItem = $derived.by(() => {
    const items = getOrderedNavigableContent(courseApi.course);
    const index = items.findIndex((entry) => entry.type === ContentType.Activity && entry.id === activityId);

    return index === -1 ? null : (items[index + 1] ?? null);
  });

  const instructions = $derived((activityApi.activity?.instructions as string | null) ?? null);
  const safeInstructions = $derived(instructions ? sanitizeHtml(instructions) : null);

  async function runLaunch(input: { unitIdentifier?: string; newAttempt?: boolean }) {
    launchedFor = `${courseId}:${activityId}`;
    playerReady = false;
    terminated = false;
    didNotConnect = false;
    bootFailed = false;
    retakesUnavailable = false;
    const result = await activityApi.launch(courseId, activityId, input);

    if (result && result.available) {
      currentUnitIdentifier = result.unit.identifier;
      displayedPlayerUrl = result.playerUrl;
    }

    return result;
  }

  async function refreshProgressAndMaybeComplete(openCompletion = true) {
    const profileId = $profile.id;
    if (!profileId) return;

    await courseApi.refreshCourse(courseId, profileId);
    const item = getOrderedNavigableContent(courseApi.course).find(
      (entry) => entry.type === ContentType.Activity && entry.id === activityId
    );

    if (item?.isComplete && openCompletion) await openCourseCompletionIfDone(courseId);
  }

  async function handleTerminated(navRequest: string | null) {
    terminated = true;
    playerReady = false;
    await refreshProgressAndMaybeComplete(availableLaunch?.mode !== 'preview');
    await activityApi.refreshProgress(courseId, activityId);

    if (!navRequest || navRequest === '_none_' || navRequest === 'exit' || navRequest === 'exitAll') {
      return;
    }

    if (navRequest === 'continue' || navRequest === '_next_') {
      const nextIncomplete = nextIncompleteModule();
      if (nextIncomplete && nextIncomplete.identifier !== currentUnitIdentifier) {
        await selectUnit(nextIncomplete.identifier);
      }
    } else if (navRequest === 'previous' || navRequest === '_previous_') {
      previousModule();
    } else if (navRequest.startsWith('choice.')) {
      const target = navRequest.replace(/^choice\.(?:\{target=)?([^}]+)\}?$/, '$1');
      const targetUnit = (availableLaunch?.units ?? []).find((unit) => unit.identifier === target);
      if (targetUnit && !targetUnit.locked) {
        await selectUnit(targetUnit.identifier);
      }
    }
  }

  function handleMessage(event: MessageEvent) {
    const url = availableLaunch?.playerUrl ?? null;
    if (!url || !isTrustedPlayerMessage(event.origin, url)) return;
    if (event.source !== playerFrame?.contentWindow) return;

    const message = parsePlayerMessage(event.data);
    if (!message) return;

    if (message.type === 'ready') {
      playerReady = true;
      didNotConnect = false;
      bootFailed = false;
    } else if (message.type === 'boot-error') {
      bootFailed = true;
      playerReady = false;
    } else if (message.type === 'completed') {
      void activityApi.refreshProgress(courseId, activityId);
      void refreshProgressAndMaybeComplete(availableLaunch?.mode !== 'preview');
    } else if (message.type === 'progress') {
      void activityApi.refreshProgress(courseId, activityId);
    } else if (message.type === 'did-not-connect') didNotConnect = true;
    else void handleTerminated(message.navRequest);
  }

  function onFullscreenChange() {
    isFullscreen = Boolean(document.fullscreenElement);

    if (isFullscreen) pokeNav();
    else {
      navVisible = true;
      clearIdleTimer();
    }
  }

  function clearIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
  }

  function pokeNav() {
    navVisible = true;
    clearIdleTimer();

    if (isImmersive && !isMenuOpen) idleTimer = setTimeout(() => (navVisible = false), 2500);
  }

  $effect(() => {
    if (isMenuOpen) {
      navVisible = true;
      clearIdleTimer();
    }
  });

  $effect(() => {
    const url = displayedPlayerUrl;
    if (!url || playerReady || terminated || didNotConnect || bootFailed) return;

    const timer = setTimeout(() => {
      if (!playerReady && !terminated && !didNotConnect) bootFailed = true;
    }, 8000);

    return () => clearTimeout(timer);
  });

  function setFocusMode(next: boolean) {
    isFocusMode = next;
    document.documentElement.style.overflow = next ? 'hidden' : '';

    if (next) pokeNav();
    else {
      navVisible = true;
      clearIdleTimer();
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }

    if (isFocusMode) {
      setFocusMode(false);
      return;
    }

    if (!frameWrap) return;

    if (typeof frameWrap.requestFullscreen !== 'function' || document.fullscreenEnabled === false) {
      setFocusMode(true);
      return;
    }

    try {
      await frameWrap.requestFullscreen();
    } catch {
      setFocusMode(true);
    }
  }

  async function selectUnit(identifier: string) {
    if (identifier === currentUnitIdentifier && playerReady && !terminated) return;

    if ((availableLaunch?.units ?? []).some((unit) => unit.identifier === identifier && unit.locked)) {
      snackbar.error('course.navItem.lessons.activities.player.module_locked');
      return;
    }

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

  function adjacentModule(offset: 1 | -1) {
    const list = availableLaunch?.units ?? [];
    const currentIndex = list.findIndex((unit) => unit.identifier === currentUnitIdentifier);
    const adjacent = currentIndex === -1 ? null : (list[currentIndex + offset] ?? null);

    if (adjacent) void selectUnit(adjacent.identifier);
  }

  function previousModule() {
    adjacentModule(-1);
  }

  function nextModule() {
    adjacentModule(1);
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
    clearIdleTimer();
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    if (isFocusMode) setFocusMode(false);
  });

  $effect(() => {
    const organizationId = $currentOrg.id;
    const profileId = $profile.id;
    if (!organizationId || !profileId || !courseId || !activityId) return;
    if (lockReason) return;
    if (launchedFor === `${courseId}:${activityId}`) return;

    void runLaunch({});
  });
</script>

<div class="mb-6 flex w-full flex-col gap-4 pb-2">
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
    {#if safeInstructions}
      <div class="ui:text-muted-foreground text-sm">{@html safeInstructions}</div>
    {/if}

    {#if launch.mode === 'preview'}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.preview_title')}</Alert.Title>
        <Alert.Description>{$t('course.navItem.lessons.activities.player.preview_body')}</Alert.Description>
      </Alert.Root>
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
        {#if allowRetakes}
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
        {/if}
      </Alert.Root>
    {/if}

    {#if showMenu && launch.units}
      <div class="ui:text-muted-foreground text-sm">
        {$t('course.navItem.lessons.activities.player.modules_complete', {
          complete: launch.units.filter((unit) => unit.completed).length,
          total: launch.units.length
        })}
      </div>
    {/if}

    <div
      bind:this={frameWrap}
      onmousemove={pokeNav}
      ontouchstart={pokeNav}
      class="ui:bg-background relative w-full overflow-hidden rounded-lg border {isImmersive
        ? 'flex flex-col border-0'
        : ''} {isFullscreen ? 'h-full rounded-none' : ''} {isFocusMode
        ? 'ui:z-modal fixed inset-0 p-2 sm:p-4'
        : ''} {isImmersive && !navVisible ? 'cursor-none' : ''}"
    >
      {#if showMenu && launch.units}
        <ActivityPlayerModuleNav
          units={launch.units}
          currentIdentifier={currentUnitIdentifier}
          onSelect={(identifier) => void selectUnit(identifier)}
          onPrevious={previousModule}
          onNext={nextModule}
          overlay={isImmersive}
          overlayVisible={navVisible}
          portalTarget={isImmersive ? frameWrap : null}
          showExit={isImmersive}
          onExit={toggleFullscreen}
          bind:menuOpen={isMenuOpen}
        />
      {/if}
      <div class={isImmersive ? 'relative min-h-0 flex-1' : 'relative'}>
        {#if isImmersive && !showMenu}
          <div class="absolute top-2 right-2 z-50">
            <Button
              size="sm"
              variant="secondary"
              onclick={toggleFullscreen}
              aria-label={$t('course.navItem.lessons.activities.player.exit_fullscreen')}
            >
              <MinimizeIcon size={14} />
            </Button>
          </div>
        {/if}
        {#if displayedPlayerUrl}
          {#key displayedPlayerUrl}
            <iframe
              bind:this={playerFrame}
              src={displayedPlayerUrl}
              title={activityApi.activity?.title ?? ''}
              class={isImmersive ? 'h-full w-full' : 'aspect-video w-full'}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              data-testid="activity-player-frame"
            ></iframe>
          {/key}
          {#if isMenuOpen}
            <div
              class="absolute inset-0 z-40 bg-transparent"
              role="presentation"
              tabindex="-1"
              onclick={() => {
                isMenuOpen = false;
              }}
            ></div>
          {/if}
          {#if !playerReady && !didNotConnect && !terminated && !bootFailed}
            <Skeleton class="absolute inset-0 h-full w-full" />
          {/if}
        {:else}
          <Skeleton class={isImmersive ? 'h-full w-full' : 'aspect-video w-full'} />
        {/if}
        {#if bootFailed}
          <div class="flex flex-col items-center gap-3 p-8 text-center">
            <p class="text-sm font-medium">{$t('course.navItem.lessons.activities.player.load_failed_title')}</p>
            <p class="ui:text-muted-foreground text-sm">
              {$t('course.navItem.lessons.activities.player.load_failed_body')}
            </p>
            <Button size="sm" variant="outline" onclick={reloadPlayer}>
              {$t('course.navItem.lessons.activities.player.reload')}
            </Button>
          </div>
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
    </div>
    {#if !isImmersive}
      <div class="flex items-center justify-between gap-2">
        <span class="ui:text-muted-foreground text-xs">
          {#if launch.mode === 'preview'}
            {$t('course.navItem.lessons.activities.player.preview_body')}
          {:else if launch.mode === 'review'}
            {$t('course.navItem.lessons.activities.player.review_body')}
          {:else}
            {$t('course.navItem.lessons.activities.player.autosave_hint')}
          {/if}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onclick={toggleFullscreen}
          aria-label={$t('course.navItem.lessons.activities.player.fullscreen')}
        >
          <MaximizeIcon size={14} />
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
    {/if}
  {/if}
</div>
