import type { ButtonProps } from './Button';
export interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> { text: string; icon?: React.ReactNode; /** ms of the scale-in swap */ animationDuration?: number; onCopy?: (status: 'success'|'failure') => void; children?: React.ReactNode; }
export declare function CopyButton(props: CopyButtonProps): JSX.Element;
