export interface RadioOptionCardOption { id: string; title: string; description: string; value: string; disabled?: boolean; }
export interface RadioOptionCardGroupProps {
  /** Omit to render RadioOptionCard / RadioItem children instead. */
  options?: RadioOptionCardOption[];
  value?: string; defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called on Enter; defaults to submitting the closest form. */
  onConfirm?: () => void;
  columns?: number;
  titleSuffix?: (option: RadioOptionCardOption) => React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export interface RadioOptionCardProps {
  id: string; title: string; description: string; value: string;
  /** Override the group selection. */
  checked?: boolean; onSelect?: (value: string) => void;
  disabled?: boolean;
  titleSuffix?: React.ReactNode;
  style?: React.CSSProperties;
}
export interface RadioItemProps {
  label?: string; value: string;
  checked?: boolean; onSelect?: (value: string) => void;
  /** Swaps the label for a text input. */
  isEditable?: boolean; onLabelChange?: (label: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function RadioOptionCardGroup(props: RadioOptionCardGroupProps): JSX.Element;
export declare function RadioOptionCard(props: RadioOptionCardProps): JSX.Element;
export declare function RadioItem(props: RadioItemProps): JSX.Element;
