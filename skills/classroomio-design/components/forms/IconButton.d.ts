import type { ButtonProps } from './Button';
export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  size?: 'icon' | 'icon-2xs' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  tooltip?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  /** keys rendered as Kbd chips beside the tooltip text */
  shortcut?: string[];
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
