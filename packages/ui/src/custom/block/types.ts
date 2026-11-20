import type { Component } from 'svelte';

export interface BlockShellMenuItem {
  label: string;
  icon?: Component<{ size?: number | string; class?: string }>;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
}

export type BlockLoaderTone = 'muted' | 'tint' | 'primary' | 'dark';

export interface BlockLoaderBlock {
  kind: string;
  title: string;
  tone: BlockLoaderTone;
  width: number;
}

export type ImageBlockFit = 'cover' | 'contain';

export interface ImageBlockSettings {
  alt: string;
  fit: ImageBlockFit;
}

export interface BlockDocumentLabels {
  view: string;
  download: string;
}

export interface FlashcardsBlockCard {
  id: string;
  question: string;
  answer: string;
}

export interface FlashcardsBlockLabels {
  editHint: string;
  flipHint: string;
  question: string;
  answer: string;
  questionPlaceholder: string;
  answerPlaceholder: string;
  flip: string;
  showQuestion: string;
  showAnswer: string;
  previous: string;
  next: string;
  progress: string;
  cards: string;
  addCard: string;
  removeCard: string;
}

export type ChartBlockType = 'bar' | 'line' | 'pie' | 'donut';

export interface ChartBlockPoint {
  id: string;
  label: string;
  value: number;
}

export interface ChartBlockLabels {
  title: string;
  titlePlaceholder: string;
  chartType: string;
  types: Record<ChartBlockType, string>;
  pointCount: (count: number) => string;
  highest: string;
  total: string;
  editData: string;
  liveHint: string;
  labelColumn: string;
  valueColumn: string;
  labelPlaceholder: string;
  addPoint: string;
  removePoint: string;
}

export interface ProcessBlockStep {
  id: string;
  heading: string;
  body: string;
  imageUrl?: string;
}

export interface ProcessBlockLabels {
  stepper: string;
  goToStep: (step: number) => string;
  untitledStep: string;
  headingPlaceholder: string;
  bodyPlaceholder: string;
  addMedia: string;
  imageOption: string;
  removeImage: string;
  deleteStep: string;
  addStep: string;
  back: string;
  next: string;
  startOver: string;
  progress: string;
}

export type TabsBlockAlignment = 'left' | 'center' | 'right';

export interface TabsBlockTab {
  id: string;
  name: string;
  note: string;
}

export interface TabsBlockLabels {
  tabList: string;
  position: string;
  alignments: Record<TabsBlockAlignment, string>;
  tabName: string;
  untitledTab: string;
  notePlaceholder: string;
  addTab: string;
  removeTab: string;
}

export interface MultipleChoiceBlockOption {
  id: string;
  text: string;
}

export interface MultipleChoiceBlockLabels {
  editHint: string;
  learnerHint: string;
  questionPlaceholder: string;
  optionPlaceholder: string;
  markCorrect: string;
  correctBadge: string;
  addOption: string;
  removeOption: string;
  addMedia: string;
  imageOption: string;
  removeImage: string;
  check: string;
  tryAgain: string;
  correctFeedback: string;
  wrongFeedback: string;
}

export interface HtmlBlockSize {
  /** Percent of the lesson column. */
  width: number;
  /** Pixels. */
  height: number;
}

export interface HtmlBlockLabels {
  frameTitle: string;
  interact: string;
  fullScreen: string;
  more: string;
  change: string;
  download: string;
  resizeWidth: string;
  resizeHeight: string;
  editWithAi: string;
  aiPlaceholder: string;
  aiSubmit: string;
  generating: string;
}

export type HtmlTemplateTone = 'orange' | 'pink' | 'red' | 'yellow' | 'blue' | 'green';

export interface HtmlTemplate {
  id: string;
  label: string;
  prompt: string;
  tone: HtmlTemplateTone;
  icon: Component<{ size?: number | string; class?: string }>;
}

export interface HtmlSourceDialogLabels {
  title: string;
  addTab: string;
  codeTab: string;
  upload: string;
  uploadHint: string;
  createWithAi: string;
  describePlaceholder: string;
  beta: string;
  generate: string;
  generating: string;
  removeTemplate: string;
  codePlaceholder: string;
  insert: string;
}
