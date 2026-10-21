export interface MultiSelectListItem { id: string; label: string; description?: string; }
export interface MultiSelectListProps {
  /** Renders "heading (count)"; omit for no heading row. */
  heading?: string;
  headingSlot?: React.ReactNode;
  /** Shown when items is empty. */
  emptyMessage: string;
  items?: MultiSelectListItem[];
  isLoading?: boolean;
  /** Controlled selection check; or pass `selected` ids. */
  isSelected?: (id: string) => boolean;
  selected?: string[];
  onToggle?: (id: string) => void;
  /** Non-empty value shows the search box. */
  searchPlaceholder?: string;
  searchValue?: string; defaultSearchValue?: string;
  onSearchValueChange?: (value: string) => void;
  /** Scroll height of the rows. */
  maxHeight?: number;
  style?: React.CSSProperties;
}
export declare function MultiSelectList(props: MultiSelectListProps): JSX.Element;
