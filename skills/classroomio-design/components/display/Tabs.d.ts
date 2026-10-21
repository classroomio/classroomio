export interface TabItem { value: string; label: React.ReactNode; content?: React.ReactNode; disabled?: boolean; }
export interface TabsProps { tabs: TabItem[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; style?: React.CSSProperties; }
export declare function Tabs(props: TabsProps): JSX.Element;