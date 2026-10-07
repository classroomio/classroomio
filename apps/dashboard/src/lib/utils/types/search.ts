export type DebouncedSearchOptions = {
  initial?: string;
  delayMs?: number;
  onApply: (search: string) => void;
};
