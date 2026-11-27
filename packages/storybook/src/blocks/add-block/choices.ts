import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
import CodeXmlIcon from '@lucide/svelte/icons/code-xml';
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
  { type: 'process', label: 'Process', icon: ArrowRightIcon },
  { type: 'html', label: 'HTML', icon: CodeXmlIcon }
];

const DETAILS: Record<string, { group: string; description: string }> = {
  note: { group: 'Text', description: 'Rich text, headings and lists' },
  video: { group: 'Media', description: 'Upload or link a video' },
  slides: { group: 'Media', description: 'Embed a slide deck' },
  document: { group: 'Media', description: 'A file students can view or download' },
  image: { group: 'Media', description: 'Upload or pick an image' },
  chart: { group: 'Interactive', description: 'A chart from your data' },
  flashcards: { group: 'Interactive', description: 'Flip cards for recall practice' },
  tabs: { group: 'Text', description: 'Split content into switchable tabs' },
  multiple_choice: { group: 'Interactive', description: 'A quick knowledge check' },
  process: { group: 'Text', description: 'A step-by-step walkthrough' },
  html: { group: 'Advanced', description: 'Your own interactive web page' }
};

const NEW_TYPES = ['chart', 'flashcards', 'tabs', 'multiple_choice', 'process', 'html'];

export const CATALOG_CHOICES: AddBlockChoice[] = ALL_CHOICES.map((choice) => ({
  ...choice,
  ...DETAILS[choice.type],
  isNew: NEW_TYPES.includes(choice.type)
}));

export const AI_SHORTCUT = { modifier: '⌘', key: 'I' };
