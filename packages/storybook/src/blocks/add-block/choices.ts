import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
import VoteIcon from '@lucide/svelte/icons/vote';
import MilestoneIcon from '@lucide/svelte/icons/milestone';
import CodeIcon from '@lucide/svelte/icons/code';
import AppWindowIcon from '@lucide/svelte/icons/app-window';
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

const DETAILS: Record<string, { group: string; description: string; caption: string }> = {
  note: {
    group: 'Text',
    description: 'Rich text, headings and lists',
    caption: 'Students read formatted text, headings and lists in the lesson flow.'
  },
  video: {
    group: 'Media',
    description: 'Upload or link a video',
    caption: 'Students play the video inline, without leaving the lesson.'
  },
  slides: {
    group: 'Media',
    description: 'Embed a slide deck',
    caption: 'Students page through the deck without leaving the lesson.'
  },
  document: {
    group: 'Media',
    description: 'A file students can view or download',
    caption: 'Students preview the pages or download the file.'
  },
  image: {
    group: 'Media',
    description: 'Upload or pick an image',
    caption: 'Students see the image full width in the lesson.'
  },
  chart: {
    group: 'Interactive',
    description: 'A chart from your data',
    caption: 'Students see your data as a chart.'
  },
  flashcards: {
    group: 'Interactive',
    description: 'Flip cards for recall practice',
    caption: 'Students flip each card to reveal the answer and step through the deck.'
  },
  tabs: {
    group: 'Text',
    description: 'Split content into switchable tabs',
    caption: 'Students switch between tabs instead of scrolling through every section.'
  },
  multiple_choice: {
    group: 'Interactive',
    description: 'A quick knowledge check',
    caption: "Students pick an answer, press Check, and see right away if it's correct."
  },
  process: {
    group: 'Text',
    description: 'A step-by-step walkthrough',
    caption: 'Students move through numbered steps, one at a time.'
  },
  html: {
    group: 'Advanced',
    description: 'Your own interactive web page',
    caption: 'Your HTML runs as a live, interactive page inside the lesson.'
  }
};

const NEW_TYPES = ['chart', 'flashcards', 'tabs', 'multiple_choice', 'process', 'html'];

export const CATALOG_CHOICES: AddBlockChoice[] = ALL_CHOICES.map((choice) => ({
  ...choice,
  ...DETAILS[choice.type],
  isNew: NEW_TYPES.includes(choice.type)
}));

export const UPCOMING_CHOICES: AddBlockChoice[] = [
  {
    type: 'upcoming_audio',
    label: 'Audio',
    group: 'Media',
    description: 'Podcast or voice note',
    caption: 'Students listen to a podcast or voice note in the lesson.',
    scene: 'audio',
    icon: AudioLinesIcon,
    comingSoon: true
  },
  {
    type: 'upcoming_poll',
    label: 'Poll',
    group: 'Interactive',
    description: 'Ask the class, show the results',
    caption: 'Students vote, then see how the class answered.',
    scene: 'poll',
    icon: VoteIcon,
    comingSoon: true
  },
  {
    type: 'upcoming_timeline',
    label: 'Timeline',
    group: 'Interactive',
    description: 'Events on a time axis',
    caption: 'Students follow events in order along a time axis.',
    scene: 'timeline',
    icon: MilestoneIcon,
    comingSoon: true
  },
  {
    type: 'upcoming_code',
    label: 'Code',
    group: 'Advanced',
    description: 'A syntax-highlighted snippet',
    caption: 'Students read highlighted code and copy it in one click.',
    scene: 'code',
    icon: CodeIcon,
    comingSoon: true
  },
  {
    type: 'upcoming_embed',
    label: 'Embed',
    group: 'Advanced',
    description: 'Any embeddable link',
    caption: 'Paste a link and students see the embedded page.',
    scene: 'embed',
    icon: AppWindowIcon,
    comingSoon: true
  }
];

export const AI_SHORTCUT = { modifier: '⌘', key: 'I' };
