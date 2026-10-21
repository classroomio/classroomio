export interface TableColumn { key: string; header: React.ReactNode; align?: 'left'|'center'|'right'; width?: number|string; render?: (row: any, index: number) => React.ReactNode; }
export interface TableProps { columns: TableColumn[]; rows: Record<string, any>[]; caption?: React.ReactNode; /** selected row indices */ selected?: number[]; onRowClick?: (row: any, index: number) => void; style?: React.CSSProperties; }
/** @startingPoint section="Display" subtitle="Data table with hover + selection" viewport="700x300" */
export declare function Table(props: TableProps): JSX.Element;