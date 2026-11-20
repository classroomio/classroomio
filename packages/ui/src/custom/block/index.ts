import ChangeButton from './block-change-button.svelte';
import Chart from './block-chart.svelte';
import Document from './block-document.svelte';
import Flashcards from './block-flashcards.svelte';
import Html from './block-html.svelte';
import HtmlSourceDialog from './block-html-source-dialog.svelte';
import Image from './block-image.svelte';
import ImageSettingsDialog from './block-image-settings-dialog.svelte';
import InlineText from './block-inline-text.svelte';
import List from './block-list.svelte';
import MultipleChoice from './block-multiple-choice.svelte';
import Loader from './block-loader.svelte';
import Note from './block-note.svelte';
import Process from './block-process.svelte';
import Shell from './block-shell.svelte';
import Slide from './block-slide.svelte';
import Tabs from './block-tabs.svelte';
import Video from './block-video.svelte';

export {
  ChangeButton,
  Chart,
  Document,
  Flashcards,
  Html,
  HtmlSourceDialog,
  Image,
  ImageSettingsDialog,
  InlineText,
  List,
  MultipleChoice,
  Loader,
  Note,
  Process,
  Shell,
  Slide,
  Tabs,
  Video,
  //
  ChangeButton as BlockChangeButton,
  Chart as ChartBlock,
  Document as DocumentBlock,
  Flashcards as FlashcardsBlock,
  Html as HtmlBlock,
  HtmlSourceDialog as HtmlBlockSourceDialog,
  Image as ImageBlock,
  InlineText as BlockInlineText,
  List as BlockList,
  MultipleChoice as MultipleChoiceBlock,
  Loader as BlockLoader,
  Note as NoteBlock,
  Process as ProcessBlock,
  Shell as BlockShell,
  Slide as SlideBlock,
  Tabs as TabsBlock,
  Video as VideoBlock
};

export { BRAND_COVER_IMAGES, DEFAULT_IMAGE_BLOCK_IMAGE } from './image-defaults';

export type {
  BlockDocumentLabels,
  BlockLoaderBlock,
  BlockLoaderTone,
  BlockShellMenuItem,
  ChartBlockLabels,
  ChartBlockPoint,
  ChartBlockType,
  FlashcardsBlockCard,
  FlashcardsBlockLabels,
  HtmlBlockLabels,
  HtmlBlockSize,
  HtmlSourceDialogLabels,
  HtmlTemplate,
  HtmlTemplateTone,
  ImageBlockFit,
  ImageBlockSettings,
  MultipleChoiceBlockLabels,
  MultipleChoiceBlockOption,
  ProcessBlockLabels,
  ProcessBlockStep,
  TabsBlockAlignment,
  TabsBlockLabels,
  TabsBlockTab
} from './types';
