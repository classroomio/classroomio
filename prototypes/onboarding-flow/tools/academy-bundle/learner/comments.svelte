<script lang="ts">
  /* components/lesson/comments.svelte: leave, edit and delete your own comments on a lesson */
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { Button } from '@cio/ui/base/button';
  import { t } from '../copy';

  interface Props {
    lessonId: string;
    user: { fullname: string; email: string; avatarUrl?: string };
    store: any;
    notify: (message: string, kind?: 'success' | 'error' | 'info') => void;
  }

  let { lessonId, user, store, notify }: Props = $props();

  let comment = $state('');
  let list = $state<Array<{ id: string; text: string; at: number }>>(store.comments(lessonId));
  let editId = $state<string | null>(null);
  let editingText = $state('');

  const initials = user.fullname
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function ago(at: number) {
    const minutes = Math.floor((Date.now() - at) / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;

    return `${Math.floor(minutes / 1440)} d ago`;
  }

  function send() {
    if (!comment.trim()) return;

    list = store.addComment(lessonId, comment.trim());
    comment = '';
  }

  function saveEdit() {
    if (!editId || !editingText.trim()) return;

    list = store.updateComment(lessonId, editId, editingText.trim());
    editId = null;
    notify('Comment updated successfully', 'success');
  }

  function remove(id: string) {
    list = store.deleteComment(lessonId, id);
    notify('Comment deleted successfully', 'success');
  }
</script>

<div class="mx-auto w-full max-w-[65ch]">
  <div class="mb-5">
    <p class="text-lg capitalize">{t('course.navItem.lessons.comments.title')} ({list.length})</p>
  </div>
  <div>
    <div class="flex h-full items-start gap-3">
      <UserAvatar src={user.avatarUrl ?? ""} alt={user.fullname} class="mt-2 size-6!" />
      <div class="h-full w-full">
        <TextareaField label={t('course.navItem.lessons.comments.text_area_title')} placeholder={t('course.navItem.lessons.comments.placeholder')} bind:value={comment} />
      </div>
    </div>
    <div class="mt-2 flex flex-row-reverse">
      <Button onclick={send} disabled={!comment.trim()}>{t('course.navItem.lessons.comments.comment_btn')}</Button>
    </div>
  </div>

  <div class="my-5">
    {#each list as item (item.id)}
      <div class="mt-2 flex items-start gap-3 pb-2">
        <UserAvatar src={user.avatarUrl ?? ""} alt={user.fullname} class="mt-2 size-6!" />
        <div class="w-full rounded-md border px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm">
              {t('course.navItem.lessons.comments.you')}
              <span class="ml-1 text-xs font-normal text-gray-800" title={new Date(item.at).toLocaleString()}>{ago(item.at)}</span>
            </p>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100" aria-label={initials}>
                <EllipsisVerticalIcon class="size-4" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  onclick={() => {
                    editId = item.id;
                    editingText = item.text;
                  }}>{t('course.navItem.lessons.comments.edit')}</DropdownMenu.Item
                >
                <DropdownMenu.Item class="text-red-600" onclick={() => remove(item.id)}>
                  {t('course.navItem.lessons.comments.delete')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
          {#if editId === item.id}
            <TextareaField placeholder={t('course.navItem.lessons.comments.placeholder')} bind:value={editingText} />
            <div class="mt-2 flex flex-row-reverse items-center gap-2">
              <Button variant="outline" onclick={() => (editId = null)}>{t('course.navItem.lessons.comments.cancel_btn')}</Button>
              <Button onclick={saveEdit} disabled={!editingText.trim()}>{t('course.navItem.lessons.comments.comment_btn')}</Button>
            </div>
          {:else}
            <article class="prose sm:prose-sm max-w-[300px] text-sm">{item.text}</article>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
