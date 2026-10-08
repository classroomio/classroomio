export interface CheckboxOptionCardProps {
  id: string; title: string; description?: string;
  checked?: boolean; defaultChecked?: boolean; disabled?: boolean;
  onChange?: (checked: boolean) => void;
  /** Rendered beside the title, e.g. a Badge. */
  titleSuffix?: React.ReactNode;
  /** Rendered before the text block. */
  leading?: React.ReactNode;
  /** Rendered under the row, inside the card. */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export interface CheckboxOptionCardOption { id: string; title: string; description?: string; value: string; disabled?: boolean; }
export interface CheckboxOptionCardGroupProps {
  options?: CheckboxOptionCardOption[];
  /** Selected option values. */
  value?: string[]; defaultValue?: string[];
  onChange?: (value: string[]) => void;
  columns?: number;
  titleSuffix?: (option: CheckboxOptionCardOption) => React.ReactNode;
  leading?: (option: CheckboxOptionCardOption) => React.ReactNode;
  footer?: (option: CheckboxOptionCardOption) => React.ReactNode;
  style?: React.CSSProperties;
}
export declare function CheckboxOptionCard(props: CheckboxOptionCardProps): JSX.Element;
export declare function CheckboxOptionCardGroup(props: CheckboxOptionCardGroupProps): JSX.Element;
