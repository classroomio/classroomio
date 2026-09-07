<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import Player from '@vimeo/player';
  import type { MediaPlayerOptions } from '../types';
  import { Button } from '../../../base/button';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

  interface Props {
    url: string;
    title?: string;
    options?: MediaPlayerOptions;
    class?: string;
  }

  let { url, title = '', options = {}, class: className = '' }: Props = $props();

  let iframeElement: HTMLIFrameElement | undefined = $state();
  let player: Player | null = null;
  let hasPrivacyError = $state(false);
  let isRetrying = $state(false);
  let reloadKey = $state(0);

  const isLearnerView = $derived(Boolean(options.isLearnerView));
  const currentHost = $derived(typeof window !== 'undefined' ? window.location.host : '');

  const privacyErrorTitle = $derived(options.vimeoPrivacyErrorTitle ?? '');
  const privacyErrorDescription = $derived(options.vimeoPrivacyErrorDescription ?? '');
  const privacyErrorUnlistedHint = $derived(options.vimeoPrivacyErrorUnlistedHint ?? '');
  const privacyErrorDomainPrefix = $derived(
    options.vimeoPrivacyErrorDomainPrefix ?? options.vimeoPrivacyErrorPrefix ?? ''
  );
  const privacyErrorDomainSuffix = $derived(
    options.vimeoPrivacyErrorDomainSuffix ?? options.vimeoPrivacyErrorSuffix ?? ''
  );
  const privacyErrorOtherHint = $derived(options.vimeoPrivacyErrorOtherHint ?? '');
  const retryLabel = $derived(options.vimeoRetryLabel ?? '');
  const learnerErrorTitle = $derived(options.vimeoLearnerErrorTitle ?? '');
  const learnerErrorDescription = $derived(options.vimeoLearnerErrorDescription ?? '');

  function initPlayer() {
    if (!iframeElement) return;

    if (player) {
      void player.destroy();
      player = null;
    }

    hasPrivacyError = false;
    isRetrying = false;

    try {
      player = new Player(iframeElement);

      player
        .ready()
        .then(() => {
          hasPrivacyError = false;
        })
        .catch((error) => {
          console.warn('[VimeoPlayer] player.ready() rejected:', error);
          hasPrivacyError = true;
        });

      player.on('error', (data) => {
        console.warn('[VimeoPlayer] error event:', data);
        if (data.name === 'PrivacyError') {
          hasPrivacyError = true;
        }
      });
    } catch (e) {
      console.warn('[VimeoPlayer] init error:', e);
    }
  }

  function handleRetry() {
    isRetrying = true;
    hasPrivacyError = false;
    reloadKey += 1;
  }

  $effect(() => {
    if (iframeElement && reloadKey >= 0) {
      untrack(() => {
        initPlayer();
      });
    }
  });

  onDestroy(() => {
    if (player) {
      void player.destroy();
      player = null;
    }
  });
</script>

<div class="ui:relative ui:aspect-video ui:w-full ui:overflow-hidden ui:rounded-md {className}">
  {#if hasPrivacyError}
    <div
      class="ui:absolute ui:inset-0 ui:z-10 ui:flex ui:flex-col ui:items-center ui:justify-center ui:gap-2 ui:overflow-y-auto ui:bg-muted/95 ui:p-3 ui:text-center ui:sm:gap-2.5 ui:sm:p-5"
    >
      <AlertTriangleIcon class="custom ui:size-5 ui:shrink-0 ui:text-amber-500 ui:sm:size-7" />
      {#if !isLearnerView}
        <div class="ui:w-full ui:max-w-sm ui:space-y-1.5 ui:text-left ui:sm:max-w-md ui:sm:space-y-2">
          {#if privacyErrorTitle}
            <p class="ui:text-center ui:text-sm ui:font-semibold ui:text-foreground">
              {privacyErrorTitle}
            </p>
          {/if}
          {#if privacyErrorDescription}
            <p class="ui:text-left ui:text-muted-foreground ui:text-xs">
              {privacyErrorDescription}
            </p>
          {/if}
          {#if privacyErrorUnlistedHint || privacyErrorDomainPrefix || privacyErrorDomainSuffix || privacyErrorOtherHint}
            <div class="ui:space-y-1 ui:text-left ui:text-[11px] ui:text-muted-foreground ui:sm:text-xs">
              {#if privacyErrorUnlistedHint}
                <div class="ui:flex ui:items-start ui:gap-1.5 ui:sm:gap-2">
                  <span class="ui:mt-1.5 ui:size-1 ui:shrink-0 ui:rounded-full ui:bg-muted-foreground/70"></span>
                  <span class="ui:flex-1">{privacyErrorUnlistedHint}</span>
                </div>
              {/if}
              {#if privacyErrorDomainPrefix || privacyErrorDomainSuffix}
                <div class="ui:flex ui:items-start ui:gap-1.5 ui:sm:gap-2">
                  <span class="ui:mt-1.5 ui:size-1 ui:shrink-0 ui:rounded-full ui:bg-muted-foreground/70"></span>
                  <span class="ui:flex-1">
                    {privacyErrorDomainPrefix}
                    <code
                      class="ui:rounded ui:border ui:bg-background ui:px-1 ui:py-0.25 ui:font-mono ui:text-[10px] ui:text-foreground ui:sm:text-[11px]"
                    >
                      {currentHost}
                    </code>
                    {privacyErrorDomainSuffix}
                  </span>
                </div>
              {/if}
              {#if privacyErrorOtherHint}
                <div class="ui:flex ui:items-start ui:gap-1.5 ui:sm:gap-2">
                  <span class="ui:mt-1.5 ui:size-1 ui:shrink-0 ui:rounded-full ui:bg-muted-foreground/70"></span>
                  <span class="ui:flex-1">{privacyErrorOtherHint}</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
        {#if retryLabel}
          <Button
            size="sm"
            variant="outline"
            onclick={handleRetry}
            disabled={isRetrying}
            class="ui:mt-0.5 ui:h-7 ui:px-2.5 ui:text-xs ui:sm:mt-1 ui:sm:h-8 ui:sm:px-3"
          >
            <RefreshCwIcon class="ui:mr-1.5 ui:size-3 ui:sm:size-3.5 {isRetrying ? 'ui:animate-spin' : ''}" />
            {retryLabel}
          </Button>
        {/if}
      {:else}
        <div class="ui:max-w-sm ui:space-y-1">
          {#if learnerErrorTitle}
            <p class="ui:text-center ui:text-sm ui:font-semibold ui:text-foreground">
              {learnerErrorTitle}
            </p>
          {/if}
          {#if learnerErrorDescription}
            <p class="ui:text-center ui:text-xs ui:text-muted-foreground">
              {learnerErrorDescription}
            </p>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#key reloadKey}
    <iframe
      bind:this={iframeElement}
      src={url}
      {title}
      class="ui:block ui:h-full ui:w-full ui:border-0"
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
    ></iframe>
  {/key}
</div>
