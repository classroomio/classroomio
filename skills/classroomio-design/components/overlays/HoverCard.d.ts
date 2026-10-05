export interface HoverCardProps { trigger: React.ReactNode; children?: React.ReactNode; side?: 'top'|'bottom'; align?: 'start'|'center'|'end'; width?: number; /** ms before opening on hover */ openDelay?: number; /** ms before closing after leaving */ closeDelay?: number; defaultOpen?: boolean; style?: React.CSSProperties; }
export declare function HoverCard(props: HoverCardProps): JSX.Element;
