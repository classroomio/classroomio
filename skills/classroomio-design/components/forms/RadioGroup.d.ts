export interface RadioOption { value: string; label: React.ReactNode; disabled?: boolean; }
export interface RadioGroupProps { options: RadioOption[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; orientation?: 'vertical'|'horizontal'; disabled?: boolean; style?: React.CSSProperties; }
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;