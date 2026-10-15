import english from '../../../../../apps/dashboard/src/lib/utils/translations/en.json';

type Variables = Record<string, string | number>;

function lookup(key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], english);

  return typeof value === 'string' ? value : key;
}

function format(template: string, variables: Variables = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in variables ? String(variables[name]) : match));
}

export const t = {
  get: (key: string, variables?: Variables) => format(lookup(key), variables)
};
