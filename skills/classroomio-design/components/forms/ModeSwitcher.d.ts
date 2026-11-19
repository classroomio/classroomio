export type ThemeMode = 'light' | 'dark' | 'system';
export interface ModeSwitcherProps { mode?: ThemeMode; defaultMode?: ThemeMode; onModeChange?: (mode: ThemeMode) => void; defaultOpen?: boolean; }
export declare function ModeSwitcher(props: ModeSwitcherProps): JSX.Element;
