export interface DetailRow { label: string; value: React.ReactNode; mono?: boolean; }
export interface DetailRowsProps { rows: DetailRow[]; tone?: 'light'|'dark'; style?: React.CSSProperties; }
export declare function DetailRows(props: DetailRowsProps): JSX.Element;