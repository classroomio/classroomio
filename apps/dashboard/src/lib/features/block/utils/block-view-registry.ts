import type { Component } from 'svelte';
import type { TBlockType } from '@cio/utils/validation/block';
import ChartView from '../components/chart/chart-view.svelte';
import DocumentView from '../components/document/document-view.svelte';
import FlashcardsView from '../components/flashcards/flashcards-view.svelte';
import HtmlView from '../components/html/html-view.svelte';
import ImageView from '../components/image/image-view.svelte';
import MultipleChoiceView from '../components/multiple-choice/multiple-choice-view.svelte';
import ProcessView from '../components/process/process-view.svelte';
import NoteView from '../components/note/note-view.svelte';
import SlidesView from '../components/slides/slides-view.svelte';
import TabsView from '../components/tabs/tabs-view.svelte';
import VideoView from '../components/video/video-view.svelte';
import type { BlockViewProps } from './types';

export const BLOCK_VIEWS: { [K in TBlockType]: Component<BlockViewProps<K>> } = {
  note: NoteView,
  video: VideoView,
  slides: SlidesView,
  document: DocumentView,
  image: ImageView,
  chart: ChartView,
  flashcards: FlashcardsView,
  tabs: TabsView,
  multiple_choice: MultipleChoiceView,
  process: ProcessView,
  html: HtmlView
};
