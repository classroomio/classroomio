export interface MenubarItem {
  label?: React.ReactNode; icon?: React.ReactNode; shortcut?: string; variant?: 'default'|'destructive'; disabled?: boolean; inset?: boolean; onSelect?: () => void;
  /** render a separator line */ separator?: boolean;
  /** render a group label */ heading?: string;
  /** checkbox item; initial state */ checked?: boolean; type?: 'checkbox';
  /** radio item: items sharing a radioGroup are exclusive; radioSelected is the initially chosen radioValue */ radioGroup?: string; radioValue?: string; radioSelected?: string;
  onCheckedChange?: (value: boolean | string) => void;
  /** nested submenu */ items?: MenubarItem[];
}
export interface MenubarMenu { label: React.ReactNode; items: MenubarItem[]; }
export interface MenubarProps { menus: MenubarMenu[]; /** index of the menu to show open initially */ defaultOpen?: number; style?: React.CSSProperties; }
export declare function Menubar(props: MenubarProps): JSX.Element;
