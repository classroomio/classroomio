export interface PersonStat { label: string; value: string; }
export interface PersonCardProps { img: string; name: string; role: string; stats?: PersonStat[]; certified?: boolean; size?: 'full'|'compact'; tilt?: number; style?: React.CSSProperties; }
/** @startingPoint section="Brand" subtitle="Rounded person card with stats + Certified ribbon" viewport="700x420" */
export declare function PersonCard(props: PersonCardProps): JSX.Element;