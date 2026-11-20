import type { Component } from 'svelte';
import type { TBlockType } from '@cio/utils/validation/block';
import DocumentView from '../components/document/document-view.svelte';
import ImageView from '../components/image/image-view.svelte';
import NoteView from '../components/note/note-view.svelte';
import SlidesView from '../components/slides/slides-view.svelte';
import VideoView from '../components/video/video-view.svelte';
import type { BlockViewProps } from './types';

export const BLOCK_VIEWS: { [K in TBlockType]: Component<BlockViewProps<K>> } = {
  note: NoteView,
  video: VideoView,
  slides: SlidesView,
  document: DocumentView,
  image: ImageView
};
