<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import TextQuoteIcon from '@lucide/svelte/icons/text-quote';
  import SquareIcon from '@lucide/svelte/icons/square';
  import PlayIcon from '@lucide/svelte/icons/play';
  import PresentationIcon from '@lucide/svelte/icons/presentation';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { cn } from '../../tools';
  import type { ReviewAnchorKind } from './types';

  interface Props {
    kind: ReviewAnchorKind;
    label: string;
    class?: string;
  }

  let { kind, label, class: className }: Props = $props();

  const ICONS = {
    course: BookOpenIcon,
    page: FileTextIcon,
    text: TextQuoteIcon,
    block: SquareIcon,
    time: PlayIcon,
    slide: PresentationIcon,
    point: MapPinIcon,
    question: CircleHelpIcon
  } as const;

  const Icon = $derived(ICONS[kind]);
</script>

<span
  data-slot="review-anchor-chip"
  class={cn(
    'ui:inline-flex ui:items-center ui:gap-1 ui:rounded-md ui:bg-muted ui:px-2 ui:py-0.5 ui:text-[11px] ui:font-medium ui:text-foreground',
    className
  )}
>
  <Icon class="ui:size-3 ui:text-muted-foreground" aria-hidden="true" />
  {label}
</span>
