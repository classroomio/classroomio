export interface BookSpineProps { label: string; value?: React.ReactNode; caption?: string; tone?: 'paper'|'sand'|'ink'|'blue'|'sky'; width?: number; height?: number; tilt?: number; fontSize?: number; style?: React.CSSProperties; }
export declare function BookSpine(props: BookSpineProps): JSX.Element;
export interface ShelfProps { spines: BookSpineProps[]; width?: number|string; style?: React.CSSProperties; }
export declare function Shelf(props: ShelfProps): JSX.Element;