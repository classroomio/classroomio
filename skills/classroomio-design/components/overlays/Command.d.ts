export interface CommandProps { value?: string; defaultValue?: string; onValueChange?: (search: string) => void; /** return 0 to hide an item */ filter?: (value: string, search: string, keywords?: string[]) => number; shouldFilter?: boolean; /** palette sizing used inside CommandDialog */ large?: boolean; style?: React.CSSProperties; children?: React.ReactNode; }
export interface CommandInputProps { placeholder?: string; style?: React.CSSProperties; }
export interface CommandGroupProps { heading?: string; style?: React.CSSProperties; children?: React.ReactNode; }
export interface CommandItemProps { value?: string; keywords?: string[]; disabled?: boolean; icon?: React.ReactNode; onSelect?: (value: string) => void; style?: React.CSSProperties; children?: React.ReactNode; }
export interface CommandDialogProps { open?: boolean; onOpenChange?: (open: boolean) => void; title?: string; description?: string; value?: string; onValueChange?: (search: string) => void; children?: React.ReactNode; }
type Plain = { style?: React.CSSProperties; children?: React.ReactNode };
export declare function Command(props: CommandProps): JSX.Element;
export declare function CommandInput(props: CommandInputProps): JSX.Element;
export declare function CommandList(props: Plain): JSX.Element;
export declare function CommandEmpty(props: Plain): JSX.Element;
export declare function CommandGroup(props: CommandGroupProps): JSX.Element;
export declare function CommandItem(props: CommandItemProps): JSX.Element | null;
export declare function CommandSeparator(props: { style?: React.CSSProperties }): JSX.Element;
export declare function CommandShortcut(props: Plain): JSX.Element;
export declare function CommandDialog(props: CommandDialogProps): JSX.Element;
