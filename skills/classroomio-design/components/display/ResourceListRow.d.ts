export interface ResourceListGroupProps { children?: React.ReactNode; style?: React.CSSProperties; }
/** @startingPoint section="Display" subtitle="Bordered list of resource rows" viewport="700x260" */
export declare function ResourceListGroup(props: ResourceListGroupProps): JSX.Element;
export interface ResourceListRowProps {
  variant?: 'default'|'outline'|'muted'|'muted-border';
  size?: 'default'|'sm';
  /** vertical alignment of lead/main/end */
  align?: 'center'|'start';
  /** toolbar tightens block padding, e.g. a select-all header row */
  density?: 'default'|'toolbar';
  href?: string;
  onClick?: React.MouseEventHandler;
  /** set by ResourceListGroup */
  isLast?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function ResourceListRow(props: ResourceListRowProps): JSX.Element;
export interface ResourceListSlotProps { children?: React.ReactNode; style?: React.CSSProperties; }
export declare function ResourceListRowLead(props: ResourceListSlotProps): JSX.Element;
export declare function ResourceListRowMain(props: ResourceListSlotProps): JSX.Element;
export declare function ResourceListRowEnd(props: ResourceListSlotProps): JSX.Element;
