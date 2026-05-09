<script lang="ts">
  import { cn } from '../../tools';
  import { SafeHtmlContent } from '../safe-html-content';
  import Callout from './callout.svelte';
  import type { PublicCourseCalloutData, PublicLessonViewData } from './types';

  interface Props {
    lesson: PublicLessonViewData;
    callout?: PublicCourseCalloutData | null;
    class?: string;
  }

  let { lesson, callout = null, class: className }: Props = $props();

  const isYoutube = $derived(lesson.video?.type === 'youtube');

  function toEmbedUrl(link: string): string {
    try {
      const url = new URL(link);
      if (url.hostname.includes('youtu.be')) {
        const videoId = url.pathname.replace(/^\//, '');
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.hostname.includes('youtube.com')) {
        const videoId = url.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
      return link;
    } catch {
      return link;
    }
  }
</script>

<!--
  Public lesson page. Width / spacing intentionally mirrors the authenticated
  lesson view (see `apps/dashboard/src/lib/features/course/pages/lesson.svelte`)
  so creators see the same content layout whether they're logged in or sharing
  a public link. The `prose` class (no `ui:` prefix) hooks into the dashboard's
  app.css typography rules.
-->
<article class={cn('ui:mx-auto ui:w-full ui:max-w-3xl ui:px-4 ui:py-8 ui:sm:px-6 ui:lg:py-10', className)}>
  {#if !lesson.isUnlocked}
    <Callout variant="full" {callout} />
  {:else}
    {#if lesson.video}
      <div class="ui:mb-6 ui:overflow-hidden ui:rounded-xl ui:bg-black">
        {#if isYoutube}
          <iframe
            class="ui:aspect-video ui:w-full"
            src={toEmbedUrl(lesson.video.link)}
            title={lesson.title}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        {:else}
          <video class="ui:aspect-video ui:w-full" controls playsinline src={lesson.video.link}>
            <track kind="captions" />
          </video>
        {/if}
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

    <Callout variant="inline" {callout} />
  {/if}
</article>
