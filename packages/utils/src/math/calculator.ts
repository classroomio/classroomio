export type CalculatorAngleMode = 'deg' | 'rad';

export type CalculatorResult = { ok: true; value: number } | { ok: false };

type Token = { type: 'number'; value: number } | { type: 'name'; value: string } | { type: 'symbol'; value: string };

const SYMBOL_ALIASES: Record<string, string> = { '×': '*', '·': '*', '÷': '/', '−': '-', '√': 'sqrt' };
const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };
const TOKEN_PATTERN = /\s*(?:(\d+\.?\d*|\.\d+)(?:[eE]([+-]?\d+))?|([a-zA-Zπ]+)|(.))/gy;
const MAX_FACTORIAL = 170;

class CalculatorSyntaxError extends Error {}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  TOKEN_PATTERN.lastIndex = 0;

  while (TOKEN_PATTERN.lastIndex < source.length) {
    const match = TOKEN_PATTERN.exec(source);
    if (!match) break;

    const [, numberText, exponentText, nameText, symbolText] = match;
    if (numberText !== undefined) {
      tokens.push({ type: 'number', value: Number(exponentText ? `${numberText}e${exponentText}` : numberText) });
      continue;
    }

    if (nameText !== undefined) {
      tokens.push({ type: 'name', value: nameText.toLowerCase() === 'π' ? 'π' : nameText.toLowerCase() });
      continue;
    }

    if (symbolText.trim()) tokens.push({ type: 'symbol', value: SYMBOL_ALIASES[symbolText] ?? symbolText });
  }

  return tokens.flatMap((token) =>
    token.type === 'symbol' && token.value === 'sqrt' ? [{ type: 'name', value: 'sqrt' } as Token] : [token]
  );
}

function factorial(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_FACTORIAL) throw new CalculatorSyntaxError();

  let result = 1;
  for (let factor = 2; factor <= value; factor++) result *= factor;

  return result;
}

function createFunctions(angleMode: CalculatorAngleMode): Record<string, (value: number) => number> {
  const toRadians = (value: number) => (angleMode === 'deg' ? (value * Math.PI) / 180 : value);
  const fromRadians = (value: number) => (angleMode === 'deg' ? (value * 180) / Math.PI : value);

  return {
    sin: (value) => Math.sin(toRadians(value)),
    cos: (value) => Math.cos(toRadians(value)),
    tan: (value) => Math.tan(toRadians(value)),
    asin: (value) => fromRadians(Math.asin(value)),
    acos: (value) => fromRadians(Math.acos(value)),
    atan: (value) => fromRadians(Math.atan(value)),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    ln: Math.log,
    log: Math.log10,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    exp: Math.exp
  };
}

/**
 * Evaluates a calculator expression such as `2(3+4)^2`, `sin(30)` or `5!` without `eval`. Supports `+ - * / ^ ! %`,
 * parentheses, implicit multiplication, `pi`, `e`, and the usual functions; trig functions follow `angleMode`.
 */
export function evaluateCalculatorExpression(source: string, angleMode: CalculatorAngleMode = 'deg'): CalculatorResult {
  const functions = createFunctions(angleMode);
  const tokens = tokenize(source);
  let position = 0;

  const peek = () => tokens[position];
  const isSymbol = (token: Token | undefined, value: string) => token?.type === 'symbol' && token.value === value;

  function parseExpression(): number {
    let result = parseTerm();
    while (isSymbol(peek(), '+') || isSymbol(peek(), '-')) {
      const operator = (tokens[position++] as { value: string }).value;
      const right = parseTerm();
      result = operator === '+' ? result + right : result - right;
    }

    return result;
  }

  function startsOperand(token: Token | undefined): boolean {
    return token?.type === 'number' || token?.type === 'name' || isSymbol(token, '(');
  }

  function parseTerm(): number {
    let result = parseUnary();
    while (true) {
      const token = peek();
      if (isSymbol(token, '*') || isSymbol(token, '/')) {
        position++;
        const right = parseUnary();
        result = (token as { value: string }).value === '*' ? result * right : result / right;
        continue;
      }

      if (!startsOperand(token)) return result;

      result *= parseUnary();
    }
  }

  function parseUnary(): number {
    if (isSymbol(peek(), '-')) {
      position++;
      return -parseUnary();
    }
    if (isSymbol(peek(), '+')) {
      position++;
      return parseUnary();
    }

    return parsePower();
  }

  function parsePower(): number {
    const base = parsePostfix();
    if (!isSymbol(peek(), '^')) return base;

    position++;
    return base ** parseUnary();
  }

  function parsePostfix(): number {
    let result = parsePrimary();
    while (isSymbol(peek(), '!') || isSymbol(peek(), '%')) {
      const operator = (tokens[position++] as { value: string }).value;
      result = operator === '!' ? factorial(result) : result / 100;
    }

    return result;
  }

  function parsePrimary(): number {
    const token = tokens[position++];
    if (!token) throw new CalculatorSyntaxError();
    if (token.type === 'number') return token.value;

    if (token.type === 'symbol') {
      if (token.value !== '(') throw new CalculatorSyntaxError();

      const inner = parseExpression();
      if (isSymbol(peek(), ')')) position++;

      return inner;
    }

    if (token.value in CONSTANTS) return CONSTANTS[token.value];

    const applyFunction = functions[token.value];
    if (!applyFunction) throw new CalculatorSyntaxError();

    return applyFunction(isSymbol(peek(), '(') ? parsePrimary() : parsePower());
  }

  try {
    if (tokens.length === 0) return { ok: false };

    const value = parseExpression();
    if (position < tokens.length || !Number.isFinite(value)) return { ok: false };

    return { ok: true, value };
  } catch (error) {
    if (error instanceof CalculatorSyntaxError) return { ok: false };

    throw error;
  }
}

/** Formats a calculator result to at most 10 significant digits, without trailing zeros or float noise. */
export function formatCalculatorValue(value: number): string {
  if (value === 0) return '0';

  const magnitude = Math.abs(value);
  if (magnitude >= 1e15 || magnitude < 1e-9) return value.toExponential(6).replace(/\.?0+e/, 'e');

  return String(Number(value.toPrecision(10)));
}
