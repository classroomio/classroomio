export type IconName = 'sparkle'|'users'|'palette'|'bolt'|'chat'|'arrowRight'|'chevronDown'|'search'|'lock'|'plus'|'close'|'github'|'play'|'sparkleFill';
export interface IconProps { name: IconName; size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties; }
export declare function Icon(props: IconProps): JSX.Element;