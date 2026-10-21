export interface BookSpineProps { label: string; tone?: 'paper'|'sand'|'ink'|'blue'|'sky'; width?: number; height?: number; tilt?: number; style?: React.CSSProperties; }
export declare function BookSpine(props: BookSpineProps): JSX.Element;
export interface ShelfProps { children?: React.ReactNode; width?: number; }
export declare function Shelf(props: ShelfProps): JSX.Element;