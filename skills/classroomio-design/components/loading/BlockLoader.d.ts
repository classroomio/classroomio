export interface LoaderBlock { kind: string; title: string; bg: string; fg: string; label: string; width: number; }
export interface BlockLoaderProps { blocks?: LoaderBlock[]; title?: string; caption?: string; /** colour behind the blocks — paints the notches */ surface?: string; duration?: number; height?: number; style?: React.CSSProperties; }
/** @startingPoint section="Loading" subtitle="Full-page block-stack loader" viewport="700x400" */
export declare function BlockLoader(props: BlockLoaderProps): JSX.Element;
export interface CompactLoaderProps { size?: 'sm'|'md'; surface?: string; colors?: string[]; framed?: boolean; style?: React.CSSProperties; }
export declare function CompactLoader(props: CompactLoaderProps): JSX.Element;
export interface BlockGlyphProps { color?: string; /** button background, paints the bar notches */ bg?: string; size?: number; style?: React.CSSProperties; }
export declare function BlockGlyph(props: BlockGlyphProps): JSX.Element;
export interface ImportProgressProps { title?: string; file?: string; badge?: string; /** 0–100; omit for indeterminate */ value?: number; style?: React.CSSProperties; }
export declare function ImportProgress(props: ImportProgressProps): JSX.Element;
export interface BlockSkeletonProps { lines?: number[]; height?: number; surface?: string; style?: React.CSSProperties; }
export declare function BlockSkeleton(props: BlockSkeletonProps): JSX.Element;
export interface AgentDraftingProps { prompt?: string; blocks?: [string, string, string][]; surface?: string; style?: React.CSSProperties; }
export declare function AgentDrafting(props: AgentDraftingProps): JSX.Element;