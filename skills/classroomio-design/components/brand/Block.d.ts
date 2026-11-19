export type BlockTone = 'sand'|'tint'|'blue'|'ink'|'paper';
export interface BlockProps { kind?: string; title: string; tone?: BlockTone; notch?: boolean; tab?: boolean; /** colour behind the block — paints the notch */ surface?: string; width?: number|string; height?: number; style?: React.CSSProperties; }
/** @startingPoint section="Brand" subtitle="The notch-block — ClassroomIO's signature unit" viewport="700x200" */
export declare function Block(props: BlockProps): JSX.Element;
export interface BlockStackProps { blocks: BlockProps[]; surface?: string; gap?: number; style?: React.CSSProperties; }
export declare function BlockStack(props: BlockStackProps): JSX.Element;
export interface BlockGridProps { blocks: BlockProps[]; columns?: number; surface?: string; gap?: number; style?: React.CSSProperties; }
export declare function BlockGrid(props: BlockGridProps): JSX.Element;