export interface AccordionItem { title: React.ReactNode; content: React.ReactNode; }
export interface AccordionProps { items: AccordionItem[]; type?: 'single'|'multiple'; /** indices open initially */ defaultOpen?: number[]; style?: React.CSSProperties; }
export declare function Accordion(props: AccordionProps): JSX.Element;