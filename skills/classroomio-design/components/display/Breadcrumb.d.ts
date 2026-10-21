export interface BreadcrumbItem { label: React.ReactNode; href?: string; onClick?: (e: React.MouseEvent) => void; }
export interface BreadcrumbProps { items: BreadcrumbItem[]; style?: React.CSSProperties; }
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;