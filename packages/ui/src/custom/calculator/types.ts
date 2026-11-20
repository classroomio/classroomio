import type { CalculatorPolicy } from '@cio/question-types';

export type BuiltInCalculatorMode = Exclude<CalculatorPolicy, 'none' | 'graphing'>;

export interface CalculatorLabels {
  open: string;
  close: string;
  title: string;
  display: string;
  clear: string;
  backspace: string;
  equals: string;
  degrees: string;
  radians: string;
  answer: string;
  error: string;
  graphingLoading: string;
  graphingFailed: string;
}

export const DEFAULT_CALCULATOR_LABELS: CalculatorLabels = {
  open: 'Calculator',
  close: 'Close calculator',
  title: 'Calculator',
  display: 'Calculator display',
  clear: 'Clear',
  backspace: 'Delete',
  equals: 'Equals',
  degrees: 'Degrees',
  radians: 'Radians',
  answer: 'Answer',
  error: 'Error',
  graphingLoading: 'Loading graphing calculator…',
  graphingFailed: 'The graphing calculator could not load.'
};
