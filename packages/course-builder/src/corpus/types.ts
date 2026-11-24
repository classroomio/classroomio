export const BLOCK_KINDS = [
  'heading',
  'paragraph',
  'list',
  'step',
  'table',
  'image',
  'video',
  'code',
  'callout'
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

export interface CorpusBlock {
  /** Stable across re-reads while the text is unchanged: `${pageHash8}-${index}-${textHash8}`. */
  id: string;
  kind: BlockKind;
  text: string;
  /** For steps: the number the source shows. */
  stepNumber?: number;
  imageUrl?: string;
  headingPath: string[];
}

/** A block before it is given its id, which needs the page hash. */
export type BlockDraft = Omit<CorpusBlock, 'id'>;

export const EXCLUSION_REASONS = [
  'obsolete',
  'placeholder',
  'release-notes',
  'legal-or-company',
  'community',
  'duplicate',
  'other-locale',
  'too-short'
] as const;

export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export interface CorpusPage {
  pageId: string;
  url: string;
  title: string;
  path: string[];
  order: number;
  contentHash: string;
  blocks: CorpusBlock[];
  wordCount: number;
  excluded: ExclusionReason | null;
  /** Release notes stay available for "which name is current" checks but are never taught. */
  referenceOnly: boolean;
}

export interface Corpus {
  locale: string;
  pages: CorpusPage[];
  /** How many pages each exclusion reason removed. */
  excluded: Record<ExclusionReason, number>;
}
