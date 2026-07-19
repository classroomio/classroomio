<script lang="ts">
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import ImageIcon from '@lucide/svelte/icons/image';
  import LockIcon from '@lucide/svelte/icons/lock';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { cn } from '@cio/ui/tools';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { NoteShareVisibility } from '../utils/types';
  import type { Snippet } from 'svelte';
  import NoteCoverUpload from './note-cover-upload.svelte';

  interface Props {
    title?: string;
    visibility?: NoteShareVisibility;
    coverImageUrl?: string | null;
    canWrite?: boolean;
    isSavingCover?: boolean;
    actions?: Snippet;
    meta?: Snippet;
    children?: Snippet;
    onTitleInput?: (event: Event) => void;
    onTitleKeydown?: (event: KeyboardEvent) => void;
    onCoverUploaded?: (url: string) => void | Promise<void>;
    onCoverRemoved?: () => void | Promise<void>;
    class?: string;
  }

  let {
    title = '',
    visibility = 'private',
    coverImageUrl = null,
    canWrite = false,
    isSavingCover = false,
    actions,
    meta,
    children,
    onTitleInput,
    onTitleKeydown,
    onCoverUploaded,
    onCoverRemoved,
    class: className = ''
  }: Props = $props();

  let titleRef = $state<HTMLTextAreaElement | null>(null);
  let showCoverUpload = $state(false);

  const visibilityLabel = $derived(
    visibility === 'team'
      ? t.get('notes.page.visibility_team')
      : visibility === 'public'
        ? t.get('notes.page.visibility_public')
        : t.get('notes.page.visibility_private')
  );

  const PageIcon = $derived(
    visibility === 'team' ? UsersIcon : visibility === 'public' ? GlobeIcon : LockIcon
  );

  function resizeTitle(node: HTMLTextAreaElement) {
    const resize = () => {
      node.style.height = '0px';
      node.style.height = `${node.scrollHeight}px`;
    };

    resize();
    node.addEventListener('input', resize);

    return {
      destroy() {
        node.removeEventListener('input', resize);
      }
    };
  }

  $effect(() => {
    title;
    titleRef?.dispatchEvent(new Event('input'));
  });
</script>

<article class={cn('flex min-h-full w-full flex-col', className)}>
  <div class="group/cover relative w-full shrink-0">
    {#if coverImageUrl}
      <img src={coverImageUrl} alt="" class="h-40 w-full object-cover" />
    {:else}
      <div
        class="h-32 w-full bg-gradient-to-r from-violet-100 via-sky-50 to-amber-50 dark:from-violet-950/40 dark:via-sky-950/20 dark:to-amber-950/20"
        aria-hidden="true"
      ></div>
    {/if}

    {#if canWrite}
      <div
        class="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 opacity-0 transition-opacity group-hover/cover:opacity-100"
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          class="bg-background/90 backdrop-blur-sm"
          loading={isSavingCover}
          onclick={() => (showCoverUpload = true)}
        >
          <ImageIcon size={14} />
          {coverImageUrl ? $t('notes.page.change_cover') : $t('notes.page.add_cover')}
        </Button>

        {#if coverImageUrl}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            class="bg-background/90 backdrop-blur-sm"
            loading={isSavingCover}
            onclick={() => onCoverRemoved?.()}
          >
            <Trash2Icon size={14} />
            {$t('notes.page.remove_cover')}
          </Button>
        {/if}
      </div>
    {/if}

    {#if actions}
      <div class="absolute right-4 top-4 flex items-center gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>

  <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-8 pb-16 md:px-12">
    <div class="-mt-7 mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-xl border bg-background text-3xl shadow-sm">
      <PageIcon size={36} class="ui:text-muted-foreground" />
    </div>

    <textarea
      bind:this={titleRef}
      use:resizeTitle
      value={title}
      readonly={!canWrite}
      rows={1}
      class="placeholder:ui:text-muted-foreground/45 w-full resize-none border-0 bg-transparent p-0 text-4xl leading-[1.15] font-bold tracking-tight shadow-none outline-none focus:ring-0 md:text-5xl"
      placeholder={$t('notes.org.new_note_title')}
      oninput={onTitleInput}
      onkeydown={onTitleKeydown}
    ></textarea>

    <p class="ui:text-muted-foreground mt-2 text-sm">{visibilityLabel}</p>

    {#if meta}
      <div class="mt-4 flex flex-col gap-3">
        {@render meta()}
      </div>
    {/if}

    <div class="mt-6 flex min-h-0 flex-1 flex-col">
      {@render children?.()}
    </div>
  </div>
</article>

{#if canWrite}
  <NoteCoverUpload bind:open={showCoverUpload} onUploaded={onCoverUploaded} />
{/if}
