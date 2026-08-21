<script lang="ts">
  import { getQuestionTypeById, type QuestionTypeKey } from '@cio/question-types';
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
  import Link2Icon from '@lucide/svelte/icons/link-2';
  import SquareCheckIcon from '@lucide/svelte/icons/square-check';
  import StarIcon from '@lucide/svelte/icons/star';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { QUESTION_TYPE_KEY } from '@cio/question-types';
  import { getQuestionTypePickerItem } from './picker-data';
  import { cn } from '../../tools';

  interface Props {
    key?: QuestionTypeKey | string | null;
    typeId?: number | null;
    class?: string;
    iconClass?: string;
  }

  let { key = null, typeId = null, class: className = '', iconClass = '' }: Props = $props();

  const resolvedKey = $derived.by<QuestionTypeKey | null>(() => {
    if (key) return key as QuestionTypeKey;
    if (typeof typeId === 'number') {
      const meta = getQuestionTypeById(typeId);
      return (meta?.key as QuestionTypeKey) ?? null;
    }
    return null;
  });

  const pickerItem = $derived(resolvedKey ? getQuestionTypePickerItem(resolvedKey) : undefined);
  const glyph = $derived(pickerItem?.sidebarGlyph ?? null);

  function iconForKey(typeKey: QuestionTypeKey | null) {
    switch (typeKey) {
      case QUESTION_TYPE_KEY.RADIO:
        return CircleDotIcon;
      case QUESTION_TYPE_KEY.CHECKBOX:
        return SquareCheckIcon;
      case QUESTION_TYPE_KEY.WORD_BANK:
        return LayoutGridIcon;
      case QUESTION_TYPE_KEY.ORDERING:
        return ArrowUpDownIcon;
      case QUESTION_TYPE_KEY.FILE_UPLOAD:
        return UploadIcon;
      case QUESTION_TYPE_KEY.LINK:
        return Link2Icon;
      case QUESTION_TYPE_KEY.STAR:
        return StarIcon;
      case QUESTION_TYPE_KEY.THUMBS:
        return ThumbsUpIcon;
      case QUESTION_TYPE_KEY.VIDEO_RECORDING:
        return VideoIcon;
      default:
        return CircleDotIcon;
    }
  }

  const LucideIcon = $derived(iconForKey(resolvedKey));
</script>

<span
  class={cn(
    'ui:flex ui:size-7 ui:shrink-0 ui:items-center ui:justify-center ui:rounded-md ui:bg-muted ui:text-foreground',
    className
  )}
  aria-hidden="true"
>
  {#if glyph}
    <span class="ui:text-[13px] ui:font-semibold ui:leading-none">{glyph}</span>
  {:else}
    <LucideIcon class={cn('ui:size-4 ui:opacity-90', iconClass)} aria-hidden="true" />
  {/if}
</span>
