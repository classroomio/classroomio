import type { SupportedLanguage } from './shiki';

const extToLang: Record<string, SupportedLanguage> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.svelte': 'svelte',
  '.json': 'json',
  '.bash': 'bash',
  '.sh': 'bash',
  '.diff': 'diff'
};

/** Derive Shiki/Code language from a filename. Defaults to `typescript` if unknown. */
export function langFromFilename(filename: string): SupportedLanguage {
  const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
  return extToLang[ext] ?? 'typescript';
}
