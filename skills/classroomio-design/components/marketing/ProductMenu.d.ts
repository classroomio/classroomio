export interface ProductMenuItem { icon: string; title: string; body: string; }
export interface ProductMenuProps { items?: ProductMenuItem[]; feature?: { label: string; title: string; body: string } | null; onSelect?: (item: ProductMenuItem) => void; style?: React.CSSProperties; }
export declare function ProductMenu(props: ProductMenuProps): JSX.Element;