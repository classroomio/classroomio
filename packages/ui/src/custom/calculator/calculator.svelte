<script lang="ts">
  import { evaluateCalculatorExpression, formatCalculatorValue, type CalculatorAngleMode } from '@cio/utils/math';
  import { Button } from '../../base/button';
  import { Input } from '../../base/input';
  import { cn } from '../../tools';
  import { DEFAULT_CALCULATOR_LABELS, type BuiltInCalculatorMode, type CalculatorLabels } from './types';

  interface Props {
    mode: BuiltInCalculatorMode;
    labels?: CalculatorLabels;
    class?: string;
  }

  let { mode, labels = DEFAULT_CALCULATOR_LABELS, class: className = '' }: Props = $props();

  type Key = {
    label: string;
    insert?: string;
    action?: 'clear' | 'backspace' | 'equals' | 'answer';
    variant?: 'accent';
  };

  const DIGIT_KEYS: Key[][] = [
    [{ label: '7' }, { label: '8' }, { label: '9' }, { label: '÷', insert: '÷', variant: 'accent' }],
    [{ label: '4' }, { label: '5' }, { label: '6' }, { label: '×', insert: '×', variant: 'accent' }],
    [{ label: '1' }, { label: '2' }, { label: '3' }, { label: '−', insert: '-', variant: 'accent' }],
    [
      { label: '0' },
      { label: '.' },
      { label: '=', action: 'equals', variant: 'accent' },
      { label: '+', insert: '+', variant: 'accent' }
    ]
  ];

  const SCIENTIFIC_KEYS: Key[][] = [
    [
      { label: 'sin', insert: 'sin(' },
      { label: 'cos', insert: 'cos(' },
      { label: 'tan', insert: 'tan(' },
      { label: 'π', insert: 'pi' }
    ],
    [
      { label: 'sin⁻¹', insert: 'asin(' },
      { label: 'cos⁻¹', insert: 'acos(' },
      { label: 'tan⁻¹', insert: 'atan(' },
      { label: 'e', insert: 'e' }
    ],
    [
      { label: 'ln', insert: 'ln(' },
      { label: 'log', insert: 'log(' },
      { label: '√', insert: 'sqrt(' },
      { label: 'x²', insert: '^2' }
    ],
    [
      { label: 'xʸ', insert: '^' },
      { label: '(', insert: '(' },
      { label: ')', insert: ')' },
      { label: 'n!', insert: '!' }
    ],
    [
      { label: '%', insert: '%' },
      { label: '|x|', insert: 'abs(' },
      { label: '1/x', insert: '^(-1)' },
      { label: 'Ans', action: 'answer' }
    ]
  ];

  let expression = $state('');
  let result = $state('');
  let lastAnswer = $state<number | null>(null);
  let angleMode = $state<CalculatorAngleMode>('deg');
  let hasError = $state(false);

  const showScientific = $derived(mode === 'scientific');

  function press(key: Key) {
    hasError = false;

    if (key.action === 'clear') {
      expression = '';
      result = '';
      return;
    }

    if (key.action === 'backspace') {
      expression = expression.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|sqrt\(|abs\(|ln\(|log\(|pi|.)$/, '');
      return;
    }

    if (key.action === 'equals') {
      evaluate();
      return;
    }

    if (key.action === 'answer') {
      if (lastAnswer !== null) expression += formatCalculatorValue(lastAnswer);
      return;
    }

    expression += key.insert ?? key.label;
  }

  function evaluate() {
    const outcome = evaluateCalculatorExpression(expression, angleMode);
    if (!outcome.ok) {
      hasError = Boolean(expression.trim());
      result = '';
      return;
    }

    lastAnswer = outcome.value;
    result = formatCalculatorValue(outcome.value);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    evaluate();
  }
</script>

<div class={cn('ui:w-72 ui:space-y-2', className)} data-slot="calculator" data-mode={mode}>
  <div class="ui:space-y-1 ui:rounded-md ui:border ui:bg-muted ui:p-2">
    <Input
      class="ui:h-8 ui:border-0 ui:bg-transparent ui:text-right ui:font-mono ui:shadow-none"
      aria-label={labels.display}
      autocomplete="off"
      bind:value={expression}
      onkeydown={handleKeydown}
    />
    <p
      class="ui:h-7 ui:truncate ui:text-right ui:font-mono ui:text-xl ui:font-semibold"
      data-testid="calculator-result"
      aria-live="polite"
    >
      {hasError ? labels.error : result}
    </p>
  </div>

  {#if showScientific}
    <div class="ui:flex ui:gap-1">
      <Button
        type="button"
        size="sm"
        variant={angleMode === 'deg' ? 'default' : 'outline'}
        class="ui:flex-1"
        onclick={() => (angleMode = 'deg')}
      >
        {labels.degrees}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={angleMode === 'rad' ? 'default' : 'outline'}
        class="ui:flex-1"
        onclick={() => (angleMode = 'rad')}
      >
        {labels.radians}
      </Button>
    </div>
    {#each SCIENTIFIC_KEYS as row, rowIndex (rowIndex)}
      <div class="ui:grid ui:grid-cols-4 ui:gap-1">
        {#each row as key (key.label)}
          <Button type="button" size="sm" variant="secondary" onclick={() => press(key)}>{key.label}</Button>
        {/each}
      </div>
    {/each}
  {/if}

  <div class="ui:grid ui:grid-cols-2 ui:gap-1">
    <Button type="button" size="sm" variant="outline" onclick={() => press({ label: 'C', action: 'clear' })}>
      {labels.clear}
    </Button>
    <Button type="button" size="sm" variant="outline" onclick={() => press({ label: '⌫', action: 'backspace' })}>
      {labels.backspace}
    </Button>
  </div>

  {#each DIGIT_KEYS as row, rowIndex (rowIndex)}
    <div class="ui:grid ui:grid-cols-4 ui:gap-1">
      {#each row as key (key.label)}
        <Button
          type="button"
          size="sm"
          variant={key.variant === 'accent' ? 'default' : 'secondary'}
          aria-label={key.action === 'equals' ? labels.equals : undefined}
          onclick={() => press(key)}
        >
          {key.label}
        </Button>
      {/each}
    </div>
  {/each}
</div>
