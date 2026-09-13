import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges and resolves conflicting Tailwind CSS classes while preserving `@cio/ui` theme prefixes (`ui:`).
 * Normalizes prefixed tokens before passing them to `tailwind-merge` and restores original prefixes on output.
 *
 * @param inputs - Class names, conditional objects, or class arrays to merge.
 * @returns Deduplicated and resolved class string.
 */
export function cn(...inputs: ClassValue[]) {
  const rawClass = clsx(inputs);
  if (!rawClass || !rawClass.includes('ui:')) return twMerge(rawClass);

  const tokens = rawClass.split(/\s+/).filter(Boolean);
  const len = tokens.length;
  if (len <= 1) return tokens[0] || '';

  const normalizedTokens = new Array<string>(len);
  const tokenToOriginal = new Map<string, string>();

  for (let i = 0; i < len; i++) {
    const token = tokens[i];
    const unprefixed = token.startsWith('ui:') ? token.slice(3) : token;
    normalizedTokens[i] = unprefixed;
    tokenToOriginal.set(unprefixed, token);
  }

  const merged = twMerge(normalizedTokens.join(' '));
  return merged
    .split(' ')
    .map((token) => tokenToOriginal.get(token) || token)
    .join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
