import type { Component } from 'svelte';

/**
 * Chart configuration type — no layerchart runtime dependency.
 * Import from here instead of '@cio/ui/base/chart' to keep the SSR module graph
 * free from layerchart's circular dependency.
 */
export type ChartConfig = {
  [k in string]: {
    label?: string;
    icon?: Component;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<'light' | 'dark', string> });
};
