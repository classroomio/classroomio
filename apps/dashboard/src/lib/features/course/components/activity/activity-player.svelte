<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import * as Alert from '@cio/ui/base/alert';
  import { Empty } from '@cio/ui/custom/empty';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import MaximizeIcon from '@lucide/svelte/icons/maximize';
  import PackageIcon from '@lucide/svelte/icons/package';
  import { ContentType } from '@cio/utils/constants/content';
  import { activityApi, courseApi } from '$features/course/api';
  import StudentContentLockedNotice from '$features/course/components/student-content-locked-notice.svelte';
  import { getStudentContentLockReason } from '$features/ai-assistant/utils/content-ask-ai-bar';
  import { getOrderedNavigableContent, getContentRoute } from '$features/course/utils/content';
  import { sanitizeHtml } from '$lib/utils/functions/sanitize-html';
  import { openCourseCompletionIfDone } from '$features/course/utils/toggle-lesson-completion';
  import {
    buildPlayerUiState,
    contentOriginOf,
    isTrustedPlayerMessage,
    launchTokenFromPlayerUrl,
    parsePlayerMessage,
    playerFrameHeight,
    playerMessageSession,
    readPlayerTheme,
    supportsFullscreenDelegation
  } from '$features/course/utils/scorm-utils';
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
  let contentReady = $state(false);
  let terminated = $state(false);
  let didNotConnect = $state(false);
  let requestingAttempt = $state(false);
  let retakesUnavailable = $state(false);
  let hostMode = $state<'fullscreen' | 'full-window' | null>(null);
  let playerConnected = $state(false);
  let playerSession = $state(0);
  let themeVersion = $state(0);
  let now = $state(Date.now());
  let frameWrap = $state<HTMLElement | null>(null);
  let playerFrame = $state<HTMLIFrameElement | null>(null);
  let bootFailed = $state(false);
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
  const units = $derived(availableLaunch?.units ?? []);
  const showMenu = $derived(units.length > 1);
  const isImmersive = $derived(hostMode !== null);
  const frameHeight = $derived(playerFrameHeight(showMenu));
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

  const currentUnit = $derived(
    (availableLaunch?.units ?? []).find((unit) => unit.identifier === currentUnitIdentifier) ?? null
  );

  const nextIncomplete = $derived(nextIncompleteModule());

  const showModuleDonePanel = $derived(
    showMenu && !modulesComplete && Boolean(currentUnit?.completed) && terminated && Boolean(nextIncomplete)
  );

  const nextCourseItem = $derived.by(() => {
    const items = getOrderedNavigableContent(courseApi.course);
    const index = items.findIndex((entry) => entry.type === ContentType.Activity && entry.id === activityId);

    return index === -1 ? null : (items[index + 1] ?? null);
  });

  const instructions = $derived((activityApi.activity?.instructions as string | null) ?? null);
  const safeInstructions = $derived(instructions ? sanitizeHtml(instructions) : null);

  function resetPlayerState() {
    playerReady = false;
    contentReady = false;
    terminated = false;
    didNotConnect = false;
    bootFailed = false;
    retakesUnavailable = false;
  }

  function showPlayer(playerUrl: string) {
    playerConnected = false;
    playerSession = 0;
    displayedPlayerUrl = playerUrl;
  }

  async function runLaunch(input: { unitIdentifier?: string; newAttempt?: boolean }) {
    launchedFor = `${courseId}:${activityId}`;
    resetPlayerState();
    const result = await activityApi.launch(courseId, activityId, input);

    if (result && result.available) {
      currentUnitIdentifier = result.unit.identifier;
      showPlayer(result.playerUrl);
    }

    return result;
  }

  function postToPlayer(message: Record<string, unknown>) {
    const origin = displayedPlayerUrl ? contentOriginOf(displayedPlayerUrl) : null;
    if (!origin) return;

    playerFrame?.contentWindow?.postMessage(message, origin);
  }

  async function launchUnitInPlayer(identifier: string) {
    resetPlayerState();
    const result = await activityApi.launch(courseId, activityId, { unitIdentifier: identifier });
    if (!result || !result.available) return;

    currentUnitIdentifier = result.unit.identifier;
    const launchToken = launchTokenFromPlayerUrl(result.playerUrl);
    const sameOrigin =
      displayedPlayerUrl !== null && contentOriginOf(result.playerUrl) === contentOriginOf(displayedPlayerUrl);

    if (!launchToken || !sameOrigin || !playerFrame?.contentWindow) {
      showPlayer(result.playerUrl);
      return;
    }

    playerSession += 1;
    postToPlayer({ type: 'load-launch', launchToken, session: playerSession });
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
    contentReady = false;
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

    if (playerMessageSession(event.data) !== playerSession) {
      if (message.type === 'completed' || message.type === 'progress' || message.type === 'terminated') {
        void activityApi.refreshProgress(courseId, activityId);
        void refreshProgressAndMaybeComplete(availableLaunch?.mode !== 'preview');
      }
      return;
    }

    if (message.type === 'ready') {
      playerReady = true;
      playerConnected = true;
      didNotConnect = false;
      bootFailed = false;
      postToPlayer({ type: 'host-immersive', mode: hostMode });
    } else if (message.type === 'nav') {
      if (message.action === 'previous') previousModule();
      else if (message.action === 'next') nextModule();
      else if (message.action === 'select') void selectUnit(message.identifier);
    } else if (message.type === 'exit-immersive') {
      exitImmersive();
    } else if (message.type === 'fullscreen-unavailable') {
      setHostMode('full-window');
    } else if (message.type === 'content-loaded') {
      playerReady = true;
      contentReady = true;
    } else if (message.type === 'initialized') {
      playerReady = true;
      contentReady = true;
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

  $effect(() => {
    const url = displayedPlayerUrl;
    if (!url || playerReady || terminated || didNotConnect || bootFailed) return;

    const timer = setTimeout(() => {
      if (!playerReady && !terminated && !didNotConnect) bootFailed = true;
    }, 8000);

    return () => clearTimeout(timer);
  });

  function setHostMode(next: 'fullscreen' | 'full-window' | null) {
    hostMode = next;
    document.documentElement.style.overflow = next === 'full-window' ? 'hidden' : '';
    postToPlayer({ type: 'host-immersive', mode: next });
  }

  function exitImmersive() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    if (hostMode === 'full-window') setHostMode(null);
  }

  function delegateFullscreenToPlayer(): boolean {
    const origin = displayedPlayerUrl ? contentOriginOf(displayedPlayerUrl) : null;
    const target = playerFrame?.contentWindow;
    if (!origin || !target) return false;

    try {
      target.postMessage({ type: 'request-fullscreen' }, {
        targetOrigin: origin,
        delegate: 'fullscreen'
      } as WindowPostMessageOptions);
      return true;
    } catch {
      return false;
    }
  }

  async function toggleFullscreen() {
    if (isImmersive) {
      exitImmersive();
      return;
    }

    if (!frameWrap) return;

    if (!document.fullscreenEnabled || typeof frameWrap.requestFullscreen !== 'function') {
      setHostMode('full-window');
      return;
    }

    if (playerConnected && supportsFullscreenDelegation(navigator) && delegateFullscreenToPlayer()) return;

    try {
      await frameWrap.requestFullscreen();
    } catch {
      setHostMode('full-window');
    }
  }

  function onFullscreenChange() {
    if (document.fullscreenElement === frameWrap) setHostMode('fullscreen');
    else if (hostMode === 'fullscreen') setHostMode(null);
  }

  function handleImmersiveKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || hostMode !== 'full-window') return;

    setHostMode(null);
  }

  $effect(() => {
    if (!playerConnected || !availableLaunch) return;

    void themeVersion;
    const styles = frameWrap ? getComputedStyle(frameWrap) : null;
    const theme = styles ? readPlayerTheme((property) => styles.getPropertyValue(property)) : {};
    const ui = buildPlayerUiState(
      { units: availableLaunch.units, currentIdentifier: currentUnitIdentifier, theme },
      (key, values) => $t(key, values)
    );

    postToPlayer({ type: 'player-ui', ui });
  });

  async function selectUnit(identifier: string) {
    if (identifier === currentUnitIdentifier && playerReady && !terminated) return;

    if ((availableLaunch?.units ?? []).some((unit) => unit.identifier === identifier && unit.locked)) {
      snackbar.error('course.navItem.lessons.activities.player.module_locked');
      return;
    }

    currentUnitIdentifier = identifier;

    if (playerConnected && !bootFailed) {
      await launchUnitInPlayer(identifier);
      return;
    }

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
        resetPlayerState();
        showPlayer(result.playerUrl);
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
    window.addEventListener('keydown', handleImmersiveKeydown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    const themeObserver = new MutationObserver(() => {
      themeVersion += 1;
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme']
    });
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
      window.removeEventListener('keydown', handleImmersiveKeydown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      themeObserver.disconnect();
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      if (expiryTimer) clearInterval(expiryTimer);
    };
  });

  onDestroy(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    if (hostMode === 'full-window') document.documentElement.style.overflow = '';
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
      <div class="ui:text-muted-foreground text-sm whitespace-pre-line">{@html safeInstructions}</div>
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
      class="ui:bg-background w-full overflow-hidden {hostMode === 'full-window'
        ? 'ui:z-modal fixed inset-0 flex flex-col'
        : hostMode === 'fullscreen'
          ? 'flex h-full flex-col'
          : 'relative rounded-lg border'}"
    >
      <div class="@container relative {isImmersive ? 'min-h-0 flex-1' : ''}">
        {#if displayedPlayerUrl}
          {#key displayedPlayerUrl}
            <iframe
              bind:this={playerFrame}
              src={displayedPlayerUrl}
              title={activityApi.activity?.title ?? ''}
              class="block w-full {isImmersive ? 'h-full' : ''}"
              style:height={isImmersive ? null : frameHeight}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowfullscreen
              data-testid="activity-player-frame"
            ></iframe>
          {/key}
          {#if !contentReady && !didNotConnect && !terminated && !bootFailed}
            <div class="absolute inset-0" role="status">
              <Skeleton class="h-full w-full" />
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <LoaderCircleIcon size={28} class="ui:text-muted-foreground animate-spin motion-reduce:animate-none" />
                <p class="ui:text-muted-foreground text-sm">
                  {$t('course.navItem.lessons.activities.player.loading')}
                </p>
              </div>
            </div>
          {/if}
        {:else}
          <Skeleton class="block w-full" style="height: {isImmersive ? '100%' : frameHeight}" />
        {/if}
        {#if bootFailed}
          <div
            class="ui:bg-background absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-8 text-center"
          >
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
          <div
            class="ui:bg-background absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-8 text-center"
          >
            <p class="text-sm font-medium">{$t('course.navItem.lessons.activities.player.no_connection_title')}</p>
            <p class="ui:text-muted-foreground text-sm">
              {$t('course.navItem.lessons.activities.player.no_connection_body')}
            </p>
            <Button size="sm" variant="outline" onclick={reloadPlayer}>
              {$t('course.navItem.lessons.activities.player.reload')}
            </Button>
          </div>
        {/if}
        {#if isImmersive && (!contentReady || bootFailed || didNotConnect)}
          <button
            type="button"
            class="ui:bg-background/90 ui:hover:bg-background ui:border-border absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium shadow-sm"
            onclick={exitImmersive}
            aria-label={$t('course.navItem.lessons.activities.player.exit_fullscreen')}
          >
            {$t('course.navItem.lessons.activities.player.exit_fullscreen')}
          </button>
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

    {#if showModuleDonePanel && nextIncomplete}
      <Alert.Root>
        <Alert.Title>{$t('course.navItem.lessons.activities.player.module_complete_title')}</Alert.Title>
        <Alert.Description>
          {$t('course.navItem.lessons.activities.player.modules_complete', {
            complete: (availableLaunch?.units ?? []).filter((unit) => unit.completed).length,
            total: (availableLaunch?.units ?? []).length
          })}
        </Alert.Description>
        <div class="mt-3">
          <Button size="sm" onclick={() => void selectUnit(nextIncomplete.identifier)}>
            {$t('course.navItem.lessons.activities.player.next_module')}
          </Button>
        </div>
      </Alert.Root>
    {:else if modulesComplete}
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
