export type FieldDraftOptions<TValue, TDraft> = {
  value: () => TValue;
  format: (value: TValue) => TDraft;
  parse: (draft: TDraft) => TValue | undefined;
  normalize?: (draft: TDraft) => TValue | undefined;
  equals?: (left: TValue, right: TValue) => boolean;
  onChange: (value: TValue) => void;
  onCommit?: (value: TValue) => void;
  onReseed?: (value: TValue) => void;
};
