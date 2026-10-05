export type ButtonVariant = 'default'|'light-default'|'destructive'|'outline'|'secondary'|'ghost'|'ghost-default'|'ghost-outline'|'link';
export type ButtonSize = 'default'|'sm'|'xs'|'lg'|'icon'|'icon-2xs'|'icon-xs'|'icon-sm'|'icon-lg';
export interface ButtonProps {
  variant?: ButtonVariant; size?: ButtonSize;
  href?: string; type?: 'button'|'submit'|'reset';
  /** shows centred spinner over the label */
  loading?: boolean; disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode; style?: React.CSSProperties;
}
/** @startingPoint section="Forms" subtitle="App button — 9 variants, 9 sizes" viewport="700x340" */
export declare function Button(props: ButtonProps): JSX.Element;