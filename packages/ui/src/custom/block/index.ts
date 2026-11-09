import ChangeButton from './block-change-button.svelte';
import Document from './block-document.svelte';
import Image from './block-image.svelte';
import ImageSettingsDialog from './block-image-settings-dialog.svelte';
import List from './block-list.svelte';
import Loader from './block-loader.svelte';
import Note from './block-note.svelte';
import Shell from './block-shell.svelte';
import Slide from './block-slide.svelte';
import Video from './block-video.svelte';

export {
  ChangeButton,
  Document,
  Image,
  ImageSettingsDialog,
  List,
  Loader,
  Note,
  Shell,
  Slide,
  Video,
  //
  ChangeButton as BlockChangeButton,
  Document as DocumentBlock,
  Image as ImageBlock,
  List as BlockList,
  Loader as BlockLoader,
  Note as NoteBlock,
  Shell as BlockShell,
  Slide as SlideBlock,
  Video as VideoBlock
};

export type {
  BlockDocumentLabels,
  BlockLoaderBlock,
  BlockLoaderTone,
  BlockShellMenuItem,
  ImageBlockFit,
  ImageBlockSettings
} from './types';
