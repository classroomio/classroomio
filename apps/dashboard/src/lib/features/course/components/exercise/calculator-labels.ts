import { DEFAULT_CALCULATOR_LABELS, type CalculatorLabels } from '@cio/ui/custom/calculator';
import { t } from '$lib/utils/functions/translations';

export function getCalculatorLabels(): CalculatorLabels {
  const labels: CalculatorLabels = { ...DEFAULT_CALCULATOR_LABELS };
  labels.open = t.get('math_question.calculator.open');
  labels.close = t.get('math_question.calculator.close');
  labels.title = t.get('math_question.calculator.title');
  labels.display = t.get('math_question.calculator.display');
  labels.clear = t.get('math_question.calculator.clear');
  labels.backspace = t.get('math_question.calculator.backspace');
  labels.equals = t.get('math_question.calculator.equals');
  labels.degrees = t.get('math_question.calculator.degrees');
  labels.radians = t.get('math_question.calculator.radians');
  labels.answer = t.get('math_question.calculator.answer');
  labels.error = t.get('math_question.calculator.error');
  labels.graphingLoading = t.get('math_question.calculator.graphing_loading');
  labels.graphingFailed = t.get('math_question.calculator.graphing_failed');

  return labels;
}
