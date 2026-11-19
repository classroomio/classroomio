import BookOpenIcon from '@lucide/svelte/icons/book-open';
import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import GalleryHorizontalEndIcon from '@lucide/svelte/icons/gallery-horizontal-end';
import ImageIcon from '@lucide/svelte/icons/image';
import ListChecksIcon from '@lucide/svelte/icons/list-checks';
import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import VideoIcon from '@lucide/svelte/icons/video';
import type { TBlockType } from '@cio/utils/validation/block';
import ChartEdit from '../components/chart/chart-edit.svelte';
import { getChartExampleCopy } from '../components/chart/chart-labels';
import { createExampleChart } from '../components/chart/chart-utils';
import DocumentEdit from '../components/document/document-edit.svelte';
import DocumentPicker from '../components/document/document-picker.svelte';
import { createExampleDocument } from '../components/document/document-utils';
import FlashcardsEdit from '../components/flashcards/flashcards-edit.svelte';
import { getFlashcardsExampleCopy } from '../components/flashcards/flashcards-labels';
import { createExampleFlashcards } from '../components/flashcards/flashcards-utils';
import ImageEdit from '../components/image/image-edit.svelte';
import ImagePicker from '../components/image/image-picker.svelte';
import { createExampleImage } from '../components/image/image-utils';
import MultipleChoiceEdit from '../components/multiple-choice/multiple-choice-edit.svelte';
import { getMultipleChoiceExampleCopy } from '../components/multiple-choice/multiple-choice-labels';
import { createExampleMultipleChoice } from '../components/multiple-choice/multiple-choice-utils';
import ProcessEdit from '../components/process/process-edit.svelte';
import { getProcessExampleCopy } from '../components/process/process-labels';
import { createExampleProcess } from '../components/process/process-utils';
import NoteEdit from '../components/note/note-edit.svelte';
import { EXAMPLE_NOTE_HTML } from '../components/note/note-utils';
import SlidesEdit from '../components/slides/slides-edit.svelte';
import SlidesPicker from '../components/slides/slides-picker.svelte';
import { EXAMPLE_SLIDE } from '../components/slides/slides-utils';
import TabsEdit from '../components/tabs/tabs-edit.svelte';
import { getTabsExampleCopy } from '../components/tabs/tabs-labels';
import { createExampleTabs } from '../components/tabs/tabs-utils';
import VideoEdit from '../components/video/video-edit.svelte';
import VideoPicker from '../components/video/video-picker.svelte';
import { createExampleVideo } from '../components/video/video-utils';
import type { BlockEditorUi, BlockEditRegistry } from './types';

export const BLOCK_EDITORS: BlockEditRegistry = {
  note: {
    icon: BookOpenIcon,
    edit: NoteEdit,
    createInitial: () => ({ data: {}, content: EXAMPLE_NOTE_HTML })
  },
  video: {
    icon: VideoIcon,
    edit: VideoEdit,
    picker: VideoPicker,
    createInitial: () => ({ data: createExampleVideo() })
  },
  slides: {
    icon: PresentationIcon,
    edit: SlidesEdit,
    picker: SlidesPicker,
    createInitial: () => ({ data: { ...EXAMPLE_SLIDE } })
  },
  document: {
    icon: FileTextIcon,
    edit: DocumentEdit,
    picker: DocumentPicker,
    createInitial: () => ({ data: createExampleDocument() })
  },
  image: {
    icon: ImageIcon,
    edit: ImageEdit,
    picker: ImagePicker,
    createInitial: () => ({ data: createExampleImage() })
  },
  chart: {
    icon: ChartColumnIcon,
    edit: ChartEdit,
    createInitial: () => ({ data: createExampleChart(getChartExampleCopy()) })
  },
  flashcards: {
    icon: GalleryHorizontalEndIcon,
    edit: FlashcardsEdit,
    createInitial: () => ({ data: createExampleFlashcards(getFlashcardsExampleCopy()) })
  },
  tabs: {
    icon: PanelsTopLeftIcon,
    edit: TabsEdit,
    createInitial: () => ({ data: createExampleTabs(getTabsExampleCopy()) })
  },
  multiple_choice: {
    icon: ListChecksIcon,
    edit: MultipleChoiceEdit,
    createInitial: () => ({ data: createExampleMultipleChoice(getMultipleChoiceExampleCopy()) })
  },
  process: {
    icon: ArrowRightIcon,
    edit: ProcessEdit,
    createInitial: () => ({ data: createExampleProcess(getProcessExampleCopy()) })
  }
};

export function getBlockEditor<K extends TBlockType>(type: K): BlockEditorUi<K> {
  return BLOCK_EDITORS[type] as BlockEditorUi<K>;
}
