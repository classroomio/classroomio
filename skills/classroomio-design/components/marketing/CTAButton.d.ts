export interface CTAButtonProps {
  variant?: 'primary'|'secondary'|'inverse'|'outlineOnBlue'|'link';
  size?: 'sm'|'md'|'lg';
  href?: string; onClick?: () => void; disabled?: boolean;
  /** show trailing arrow */
  icon?: boolean;
  children?: React.ReactNode; style?: React.CSSProperties;
}
/** @startingPoint section="Marketing" subtitle="Large marketing CTA buttons" viewport="700x260" */
export declare function CTAButton(props: CTAButtonProps): JSX.Element;