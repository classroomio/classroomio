import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import GalleryHorizontalEndIcon from '@lucide/svelte/icons/gallery-horizontal-end';
import ImageIcon from '@lucide/svelte/icons/image';
import ListChecksIcon from '@lucide/svelte/icons/list-checks';
import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import VideoIcon from '@lucide/svelte/icons/video';
import type { AddBlockChoice } from '@cio/ui/custom/add-block';

export const ALL_CHOICES: AddBlockChoice[] = [
  { type: 'note', label: 'Note', icon: BookOpenIcon },
  { type: 'video', label: 'Video', icon: VideoIcon },
  { type: 'slides', label: 'Slides', icon: PresentationIcon },
  { type: 'document', label: 'Document', icon: FileTextIcon },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'chart', label: 'Chart', icon: ChartColumnIcon },
  { type: 'flashcards', label: 'Flashcards', icon: GalleryHorizontalEndIcon },
  { type: 'tabs', label: 'Tabs', icon: PanelsTopLeftIcon },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: ListChecksIcon },
  { type: 'process', label: 'Process', icon: ArrowRightIcon }
];

export const AI_SHORTCUT = { modifier: '⌘', key: 'I' };
