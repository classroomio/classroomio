import type { Component, Snippet } from 'svelte';
import type { TLocale } from '@cio/db/types';
import type {
  TBlockCreate,
  TBlockDataByType,
  TBlockType,
  TPlacementMove,
  TPlacementUpdate,
  TVideoBlockData
} from '@cio/utils/validation/block';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GenerateHtmlRequest = (typeof classroomio.agent)['generate-html']['$post'];

type BlocksRoute = (typeof classroomio.course)[':courseId']['lesson'][':lessonId']['blocks'];

export type BlockRecord = Extract<InferResponseType<BlocksRoute['$get']>, { success: true }>['data'][number];

export type BlockOf<K extends TBlockType> = Omit<BlockRecord, 'type' | 'data'> & {
  type: K;
  data: TBlockDataByType[K];
};

/** What a view renders: one block's data and its text in the locale being read. */
export interface BlockViewModel<K extends TBlockType = TBlockType> {
  id: string;
  type: K;
  data: TBlockDataByType[K];
  content: string;
}

export interface BlockViewProps<K extends TBlockType> {
  block: BlockViewModel<K>;
  index: number;
}

export interface BlockEditProps<K extends TBlockType> {
  block: BlockOf<K>;
  index: number;
  content: string;
  locale: TLocale;
  onDataChange: (data: TBlockDataByType[K]) => void;
  onContentChange: (content: string) => void;
  /** Opens the type's source picker; undefined when the type has none. */
  onRequestSource?: () => void;
  /** Opens the image picker. Resolves with the chosen image URL, or null when dismissed. */
  onRequestImage: () => Promise<string | null>;
  /** Opens the video picker. Resolves with the chosen video, or null when dismissed. */
  onRequestVideo: () => Promise<TVideoBlockData | null>;
}

export interface BlockPickerProps<K extends TBlockType> {
  open: boolean;
  onPick: (items: TBlockDataByType[K][]) => void;
  onClose: () => void;
}

export interface BlockInitialContent<K extends TBlockType> {
  data: TBlockDataByType[K];
  content?: string;
}

export interface BlockEditorUi<K extends TBlockType> {
  icon: Component;
  edit: Component<BlockEditProps<K>>;
  picker?: Component<BlockPickerProps<K>>;
  /** The block a menu click inserts; null when the author must pick a source first. */
  createInitial: () => BlockInitialContent<K> | null;
}

export type BlockEditRegistry = { [K in TBlockType]: BlockEditorUi<K> };

export interface BlockVideoPlayerProps {
  block: BlockViewModel<'video'>;
  index: number;
}

/** What a surface (lesson page, public page) supplies so the same views render there. */
export interface BlockViewHost {
  videoPlayer: Snippet<[BlockVideoPlayerProps]>;
}

/** What the editor's pickers need from the surface they run on. */
export interface BlockEditHost {
  courseId: string;
  lessonId: string;
}

/** The outcome of a data save. A conflict means another save landed first, so the caller can reload and retry. */
export type BlockDataSaveResult =
  | { status: 'saved'; record: BlockRecord }
  | { status: 'conflict'; reason: string }
  | { status: 'failed' };

/** A place that holds an ordered list of blocks, such as a lesson. */
export interface BlockOwner {
  list(): Promise<BlockRecord[] | null>;
  create(input: TBlockCreate): Promise<BlockRecord | null>;
  updateData(blockId: string, data: Record<string, unknown>, expectedVersion: number): Promise<BlockDataSaveResult>;
  updateContent(
    blockId: string,
    locale: TLocale,
    content: string,
    expectedVersion: number
  ): Promise<BlockRecord | null>;
  updatePlacement(placementId: string, settings: TPlacementUpdate): Promise<BlockRecord | null>;
  move(placementId: string, anchor: TPlacementMove): Promise<BlockRecord | null>;
  remove(placementId: string): Promise<boolean>;
}
