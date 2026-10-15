type Vars = Record<string, string | number>;

type Copy = {
  t: (key: string, vars?: Vars) => string;
  EN: Record<string, unknown>;
  questionLabels: Record<string, string>;
};

/** The product copy (apps/dashboard en.json), loaded by site/copy.js before this bundle runs. */
function copy(): Copy {
  return (window as unknown as { cioCopy: Copy }).cioCopy;
}

export function t(key: string, vars?: Vars): string {
  return copy().t(key, vars);
}

export function questionLabels(): Record<string, string> {
  return copy().questionLabels;
}
