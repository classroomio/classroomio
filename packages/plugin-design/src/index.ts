export interface PluginThemeTokens {
  background: string;
  foreground: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  foregroundMuted: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
}

export function applyThemeTokens(
  tokens: Partial<PluginThemeTokens>,
  target: HTMLElement = typeof document !== 'undefined' ? document.documentElement : (null as unknown as HTMLElement)
): void {
  if (!target || !tokens) return;

  const mapping: Record<keyof PluginThemeTokens, string> = {
    background: '--cio-background',
    foreground: '--cio-foreground',
    surface: '--cio-surface',
    surfaceMuted: '--cio-surface-muted',
    border: '--cio-border',
    foregroundMuted: '--cio-foreground-muted',
    accent: '--cio-accent',
    accentForeground: '--cio-accent-foreground',
    destructive: '--cio-destructive',
    destructiveForeground: '--cio-destructive-foreground'
  };

  for (const [key, cssVar] of Object.entries(mapping)) {
    const val = tokens[key as keyof PluginThemeTokens];
    if (val) {
      target.style.setProperty(cssVar, val);
    }
  }
}

export function getSystemThemePreference(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
