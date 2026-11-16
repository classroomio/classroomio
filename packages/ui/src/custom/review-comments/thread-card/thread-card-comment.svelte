<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '../../../tools';
  import CommentTreeHeader from '../../comment-tree/comment-tree-header.svelte';
  import ThreadCardBody from './thread-card-body.svelte';
  import type { ReviewCommentAuthor, ReviewCommentSegment } from '../types';

  interface Props {
    author: ReviewCommentAuthor;
    /** Role or "Former member" badge next to the name. */
    badge?: string | null;
    /** For example "2 h ago · edited". */
    dateLabel: string;
    segments: ReviewCommentSegment[];
    canEdit?: boolean;
    canDelete?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    /** Rendered in place of the body while the comment is being edited. */
    editor?: Snippet;
    class?: string;
  }

  let {
    author,
    badge = null,
    dateLabel,
    segments,
    canEdit = false,
    canDelete = false,
    onEdit,
    onDelete,
    editLabel,
    deleteLabel,
    editor,
    class: className
  }: Props = $props();
</script>

<div data-slot="review-thread-card-comment" class={cn('ui:flex ui:flex-col ui:gap-1 ui:py-1.5', className)}>
  <CommentTreeHeader
    avatarUrl={author.avatarUrl}
    fullname={author.fullname}
    {dateLabel}
    roleBadge={badge}
    {canEdit}
    {canDelete}
    {onEdit}
    {onDelete}
    {editLabel}
    {deleteLabel}
  />
  <div class="ui:pl-9">
    {#if editor}
      {@render editor()}
    {:else}
      <ThreadCardBody {segments} />
    {/if}
  </div>
</div>
