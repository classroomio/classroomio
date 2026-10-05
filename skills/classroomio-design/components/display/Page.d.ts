type DivProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & { style?: React.CSSProperties };
export interface PageHeaderProps extends DivProps { /** pin below the 44px app bar */ isSticky?: boolean; }
export interface PageBodyHeaderProps extends DivProps { align?: 'left' | 'right' | 'none'; }
export interface PageFloatingBarProps extends DivProps {
  /** renders only while true */
  show?: boolean;
  /** why the bar is up; also the polite live-region text */
  status: string;
  /** pin to the viewport instead of sticking at the end of the flow */
  fixed?: boolean;
  /** marker before the status */
  badge?: React.ReactNode;
  contentStyle?: React.CSSProperties;
}
export interface PageSettingsActionsProps extends Omit<PageFloatingBarProps, 'show' | 'status' | 'badge' | 'children'> {
  hasChanges?: boolean; loading?: boolean; disabled?: boolean;
  statusLabel: string; discardLabel: string; saveLabel: string;
  onSave?: () => void | Promise<void>; onDiscard?: () => void;
}
export declare function PageRoot(props: DivProps): JSX.Element;
export declare function PageHeader(props: PageHeaderProps): JSX.Element;
export declare function PageHeaderContent(props: DivProps): JSX.Element;
export declare function PageAction(props: DivProps): JSX.Element;
export declare function PageTitle(props: Omit<React.HTMLAttributes<HTMLHeadingElement>, 'style'> & { style?: React.CSSProperties }): JSX.Element;
export declare function PageSubtitle(props: Omit<React.HTMLAttributes<HTMLParagraphElement>, 'style'> & { style?: React.CSSProperties }): JSX.Element;
export declare function PageBody(props: DivProps): JSX.Element;
export declare function PageBodyHeader(props: PageBodyHeaderProps): JSX.Element;
export declare function PageFloatingBar(props: PageFloatingBarProps): JSX.Element;
export declare function PageSettingsActions(props: PageSettingsActionsProps): JSX.Element;
export declare const Page: typeof PageRoot & {
  Root: typeof PageRoot; Header: typeof PageHeader; HeaderContent: typeof PageHeaderContent; Action: typeof PageAction;
  Title: typeof PageTitle; Subtitle: typeof PageSubtitle; Body: typeof PageBody; BodyHeader: typeof PageBodyHeader;
  FloatingBar: typeof PageFloatingBar; SettingsActions: typeof PageSettingsActions;
};
