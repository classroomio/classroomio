import type { ButtonVariant } from './Button';
export interface ComboButtonItem {
  label: string;
  /** Rendered 16px before the label. */
  icon?: React.ReactNode;
  /** Shown under the label, e.g. why the item is unavailable. */
  description?: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
}
export interface ComboButtonProps {
  /** Primary half; label it with the action it performs. */
  label: string;
  /** Accessible name for the chevron trigger. */
  menuLabel: string;
  items?: ComboButtonItem[];
  icon?: React.ReactNode;
  variant?: ButtonVariant; size?: 'sm' | 'default' | 'lg';
  disabled?: boolean; loading?: boolean;
  align?: 'start' | 'end';
  onSelect?: () => void;
  style?: React.CSSProperties;
}
export declare function ComboButton(props: ComboButtonProps): JSX.Element;
