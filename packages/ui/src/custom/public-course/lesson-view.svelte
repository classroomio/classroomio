<script lang="ts">
  import { cn } from '../../tools';
  import { SafeHtmlContent } from '../safe-html-content';
  import { MediaPlayer } from '../media-player';
  import Callout from './callout.svelte';
  import type { PublicCourseCalloutAnimation, PublicCourseCalloutData, PublicLessonViewData } from './types';

  interface Props {
    lesson: PublicLessonViewData;
    /** Shown in the player captions menu; supplied by the host app (`$t(...)`) — see authenticated `lesson-video-player`. */
    videoCaptionsLabel: string;
    /**
     * For HLS videos. Host app provides a callback that mints the public
     * HLS cookie via `POST /org-site/course/.../hls-cookie`. The shared
     * media player invokes it before hls.js loads the manifest, and again
     * via `onPlaybackReload` when the learner clicks "Reload playback"
     * after a cookie-expiry / segment failure.
     */
    onBeforeHlsLoad?: () => Promise<void>;
    /**
     * Resolves a relative HLS URL (e.g. `/hls/{assetId}/master.m3u8`) into
     * an absolute URL the browser can fetch. Host app passes a resolver
     * that knows the API base URL (typically built from the typed client).
     */
    resolveHlsUrl?: (link: string) => string;
    /**
     * Strings shown on the player's reload-after-failure surface. Defaults
     * are English; host app should localise via `$t(...)` keys.
     */
    playbackErrorLabel?: string;
    playbackReloadLabel?: string;
    callout?: PublicCourseCalloutData | null;
    calloutAnimation?: PublicCourseCalloutAnimation;
    class?: string;
    id?: string;
  }

  let {
    lesson,
    videoCaptionsLabel,
    onBeforeHlsLoad,
    resolveHlsUrl,
    playbackErrorLabel,
    playbackReloadLabel,
    callout = null,
    calloutAnimation,
    class: className,
    id
  }: Props = $props();

  const isHls = $derived(Boolean(lesson.video?.hls));
  const playbackUrl = $derived.by(() => {
    if (!lesson.video) return '';
    if (isHls && resolveHlsUrl) return resolveHlsUrl(lesson.video.link);
    return lesson.video.link;
  });

  const resolvedCalloutAnimation = $derived<PublicCourseCalloutAnimation>(
    calloutAnimation ?? callout?.animation ?? 'waves'
  );

  const captionTracks = $derived.by(() => {
    const transcript = lesson.video?.transcript;

    if (!transcript?.vttUrl) {
      return [];
    }

    return [
      {
        kind: 'captions' as const,
        src: transcript.vttUrl,
        srclang: transcript.language,
        label: videoCaptionsLabel,
        default: false
      }
    ];
  });
</script>

<!--
  Public lesson page. Width / spacing intentionally mirrors the authenticated
  lesson view (see `apps/dashboard/src/lib/features/course/pages/lesson.svelte`)
  so creators see the same content layout whether they're logged in or sharing
  a public link. The `prose` class (no `ui:` prefix) hooks into the dashboard's
  app.css typography rules.
-->
<div {id} class={cn('ui:mx-auto ui:w-full ui:max-w-3xl ui:px-4 ui:py-8 ui:sm:px-6 ui:lg:py-10', className)}>
  {#if !lesson.isUnlocked}
    <Callout variant="full" {callout} animation={resolvedCalloutAnimation} />
  {:else}
    {#if lesson.video}
      <div class="ui:mb-6 ui:w-full ui:overflow-hidden ui:rounded-lg">
        <MediaPlayer
          source={{
            type: lesson.video.type,
            url: playbackUrl,
            hls: isHls,
            metadata: {
              ...(lesson.video.metadata ?? {}),
              title: lesson.video.metadata?.title ?? lesson.title
            },
            tracks: captionTracks
          }}
          options={{
            maxHeight: '569px',
            width: '100%',
            controls: true,
            playsinline: true,
            onBeforeHlsLoad: isHls ? onBeforeHlsLoad : undefined,
            playbackErrorLabel,
            playbackReloadLabel,
            onPlaybackReload: isHls ? async () => true : undefined
          }}
        />
      </div>
    {/if}

    {#if lesson.sectionTitle}
      <div class="ui:text-xs ui:font-medium ui:uppercase ui:tracking-wide ui:text-muted-foreground">
        {lesson.sectionTitle}
      </div>
    {/if}

    <h1 class="ui:mt-2 ui:text-2xl ui:tracking-tight ui:text-foreground ui:sm:text-3xl">
      {lesson.title}
    </h1>

    <div class="prose sm:prose-sm ui:mt-8 ui:max-w-none ui:dark:text-white">
      {#if lesson.body}
        <SafeHtmlContent content={lesson.body} />
      {:else}
        <p class="ui:text-muted-foreground">No content yet.</p>
      {/if}
    </div>

    <Callout variant="inline" {callout} animation={resolvedCalloutAnimation} />
  {/if}
</div>
