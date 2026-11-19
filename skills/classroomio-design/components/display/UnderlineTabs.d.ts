export interface UnderlineTabItem { value: string; label: React.ReactNode; content?: React.ReactNode; disabled?: boolean; }
export interface UnderlineTabsProps { tabs: UnderlineTabItem[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; style?: React.CSSProperties; }
export declare function UnderlineTabs(props: UnderlineTabsProps): JSX.Element;
