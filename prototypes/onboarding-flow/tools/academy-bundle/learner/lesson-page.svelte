<script lang="ts">
  /* pages/lesson.svelte in the learner view: title, mark complete + prev/next, the lesson note, comments */
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import VideoIcon from '@lucide/svelte/icons/video';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { t } from '../copy';
  import CheckCircle from './check-circle.svelte';
  import Comments from './comments.svelte';
  import type { RawItem } from './model';

  interface Props {
    lesson: RawItem;
    user: { fullname: string; email: string };
    isComplete: boolean;
    previous: RawItem | null;
    next: RawItem | null;
    showPrevNext: boolean;
    locked: boolean;
    store: any;
    notify: (message: string, kind?: 'success' | 'error' | 'info') => void;
    onToggle: () => void;
    onGo: (id: string) => void;
  }

  let { lesson, user, isComplete, previous, next, showPrevNext, locked, store, notify, onToggle, onGo }: Props = $props();

  const hasContent = $derived(Boolean(lesson.html && lesson.html.replace(/<[^>]*>/g, '').trim().length > 0) || /<(img|iframe|video|hr)/.test(lesson.html ?? ''));
  const showComments = $derived(lesson.commentsEnabled !== false);
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-4xl lg:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent>
      <div class="flex w-full items-center justify-between gap-2">
        <div class="min-w-0 flex-1 space-y-2"><Page.Title>{lesson.title}</Page.Title></div>
      </div>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          {#if showPrevNext && !locked && !isComplete}
            <Button size="sm" variant="secondary" onclick={onToggle}>
              <CheckCircle size={14} />
              <span class="text-xs">{t('course.navItem.lessons.mark_as')} {t('course.navItem.lessons.complete')}</span>
            </Button>
          {/if}
          {#if showPrevNext}
            <div class="flex items-center gap-1">
              <Button size="icon-sm" variant="outline" disabled={!previous} title={t('course.navItem.lessons.prev_shortcut')} aria-label={t('course.navItem.lessons.prev')} onclick={() => previous && onGo(previous.id)}>
                <ChevronLeftIcon size={14} />
              </Button>
              <Button size="icon-sm" variant="outline" disabled={!next || Boolean(next.locked)} title={t('course.navItem.lessons.next_shortcut')} aria-label={t('course.navItem.lessons.next')} onclick={() => next && onGo(next.id)}>
                <ChevronRightIcon size={14} />
              </Button>
            </div>
          {/if}
        </div>
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="mx-auto w-full max-w-3xl overflow-x-hidden pb-6">
        {#if locked}
          <Empty
            title={t('course.navItem.lessons.content_locked_title')}
            description={t('course.navItem.lessons.content_locked_description')}
            icon={LockIcon}
            variant="page"
            class="text-center"
          />
        {:else if hasContent}
          <div class="mb-20 flex w-full flex-col">
            <div class="relative mx-auto w-full max-w-2xl">
              <article class="preview prose sm:prose-sm dark:text-white">
                <SafeHtmlContent content={lesson.html ?? ''} />
              </article>
            </div>
            {#if showComments}
              <hr class="my-2" />
              <Comments lessonId={lesson.id} {user} {store} {notify} />
            {/if}
          </div>
        {:else}
          <Empty title={t('course.navItem.lessons.materials.no_content')} icon={VideoIcon} variant="page" class="text-center" />
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
