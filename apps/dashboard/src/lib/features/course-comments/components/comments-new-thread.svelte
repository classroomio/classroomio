<script lang="ts">
  import { NumberField } from '@cio/ui/custom/number-field';
  import { ReviewAnchorChip, ReviewThreadCard } from '@cio/ui/custom/review-comments';
  import { COURSE_COMMENT_MAX_SLIDE_NUMBER } from '@cio/utils/constants/course-comment';
  import { t } from '$lib/utils/functions/translations';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { commentsPanel } from '../store/comments-panel.svelte';
  import { getDraftChipLabel } from '../utils/anchor-utils';
  import type { CourseCommentDraftAnchor } from '../utils/types';
  import CommentsComposer from './comments-composer.svelte';

  interface Props {
    draft: CourseCommentDraftAnchor;
  }

  let { draft }: Props = $props();

  const blockType = $derived(commentsPanel.blockFilter?.blockType ?? null);
  const chipLabel = $derived(getDraftChipLabel(draft, blockType));
  const placeholder = $derived(
    commentsPanel.blockFilter
      ? $t('course_comments.composer.block_placeholder', { block: chipLabel })
      : $t('course_comments.composer.new_placeholder')
  );

  function setSlideNumber(slideNumber: number | null) {
    if (commentsPanel.draft?.type !== 'slide') return;

    commentsPanel.draft.slideNumber = slideNumber;
  }

  async function post(markup: string): Promise<boolean> {
    const created = await courseCommentsApi.createThread(draft, markup);
    if (!created) return false;

    commentsPanel.clearDraft();
    commentsPanel.activeThreadId = created.id;

    return true;
  }
</script>

<div
  class="ui:border-primary ui:bg-background my-2 rounded-xl border-[1.5px] p-3"
  data-testid="course-comments-new-thread"
>
  <ReviewThreadCard.Header>
    <ReviewAnchorChip kind={draft.type} label={chipLabel} />
  </ReviewThreadCard.Header>

  {#if draft.type === 'text'}
    <ReviewThreadCard.Quote text={draft.quote} />
  {/if}

  {#if draft.type === 'slide'}
    <div class="mb-2 max-w-40">
      <NumberField
        label={$t('course_comments.composer.slide_number')}
        integer
        allowEmpty
        min={1}
        max={COURSE_COMMENT_MAX_SLIDE_NUMBER}
        value={draft.slideNumber}
        onValueChange={setSlideNumber}
      />
    </div>
  {/if}

  <CommentsComposer
    {placeholder}
    submitLabel={$t('course_comments.composer.comment')}
    autofocus
    onSubmit={post}
    onCancel={() => commentsPanel.clearDraft()}
  />
</div>
