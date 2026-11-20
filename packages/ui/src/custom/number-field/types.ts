import type { Snippet } from 'svelte';
import type { InputProps } from '../../base/input';

export type NumberFieldProps = {
  value?: number | null;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | 'any';
  integer?: boolean;
  allowEmpty?: boolean;
  onValueChange?: (value: number | null) => void;
  onCommit?: (value: number | null) => void;
  /** Fires with the raw text on every keystroke, including text that parses to nothing. */
  onInput?: (text: string) => void;
  label?: string;
  placeholder?: string;
  name?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  errorMessage?: string;
  helperMessage?: string;
  testId?: string;
  labelAction?: Snippet;
  autoFocus?: boolean;
  onFocus?: InputProps['onfocus'];
  onBlur?: InputProps['onblur'];
};
