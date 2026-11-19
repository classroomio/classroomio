export interface CollapsibleProps { trigger: React.ReactNode; children?: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; disabled?: boolean; style?: React.CSSProperties; }
export declare function Collapsible(props: CollapsibleProps): JSX.Element;
