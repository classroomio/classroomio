export interface ToggleProps { pressed?: boolean; defaultPressed?: boolean; onChange?: (pressed: boolean) => void; variant?: 'default'|'outline'; size?: 'default'|'sm'|'lg'; disabled?: boolean; children?: React.ReactNode; style?: React.CSSProperties; }
export declare function Toggle(props: ToggleProps): JSX.Element;
export interface ToggleGroupItem { value: string; label: React.ReactNode; ariaLabel?: string; }
export interface ToggleGroupProps { items: ToggleGroupItem[]; value?: string|string[]; defaultValue?: string|string[]; onChange?: (v: any) => void; type?: 'single'|'multiple'; variant?: 'default'|'outline'; size?: 'default'|'sm'|'lg'; style?: React.CSSProperties; }
export declare function ToggleGroup(props: ToggleGroupProps): JSX.Element;