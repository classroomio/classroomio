export interface NavProps { links?: string[]; active?: string; cta?: string; onNavigate?: (page: string) => void; defaultOpen?: boolean; style?: React.CSSProperties; }
/** @startingPoint section="Marketing" subtitle="Top nav with Product mega-menu" viewport="1440x620" */
export declare function Nav(props: NavProps): JSX.Element;