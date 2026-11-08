import BookOpenIcon from '@lucide/svelte/icons/book-open';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import ImageIcon from '@lucide/svelte/icons/image';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import VideoIcon from '@lucide/svelte/icons/video';
import type { TBlockType } from '@cio/utils/validation/block';
import DocumentEdit from '../components/document/document-edit.svelte';
import DocumentPicker from '../components/document/document-picker.svelte';
import ImageEdit from '../components/image/image-edit.svelte';
import { createExampleImage } from '../components/image/image-utils';
import NoteEdit from '../components/note/note-edit.svelte';
import { EXAMPLE_NOTE_HTML } from '../components/note/note-utils';
import SlidesEdit from '../components/slides/slides-edit.svelte';
import SlidesPicker from '../components/slides/slides-picker.svelte';
import { EXAMPLE_SLIDE } from '../components/slides/slides-utils';
import VideoEdit from '../components/video/video-edit.svelte';
import VideoPicker from '../components/video/video-picker.svelte';
import { createExampleVideo } from '../components/video/video-utils';
import type { BlockEditorUi, BlockEditRegistry } from './types';

export const BLOCK_EDITORS: BlockEditRegistry = {
  note: {
    icon: BookOpenIcon,
    edit: NoteEdit,
    createInitial: () => ({ data: { style: 'default' }, content: EXAMPLE_NOTE_HTML })
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
    createInitial: () => null
  },
  image: {
    icon: ImageIcon,
    edit: ImageEdit,
    createInitial: () => ({ data: createExampleImage() })
  }
};

export function getBlockEditor<K extends TBlockType>(type: K): BlockEditorUi<K> {
  return BLOCK_EDITORS[type] as BlockEditorUi<K>;
}
