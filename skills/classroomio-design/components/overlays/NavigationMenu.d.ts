export interface NavigationMenuItem {
  value: string; label: React.ReactNode;
  /** omit for a plain link trigger; provide for a hover/click panel */ content?: React.ReactNode;
  href?: string; active?: boolean; disabled?: boolean; onClick?: (e: React.MouseEvent) => void;
}
export interface NavigationMenuProps { items: NavigationMenuItem[]; /** shared viewport under the bar (default) or per-item popover */ viewport?: boolean; /** diamond pointer under the open trigger */ indicator?: boolean; defaultValue?: string; style?: React.CSSProperties; }
export interface NavigationMenuLinkProps { href?: string; active?: boolean; onClick?: (e: React.MouseEvent) => void; style?: React.CSSProperties; children?: React.ReactNode; }
export declare function NavigationMenu(props: NavigationMenuProps): JSX.Element;
export declare function NavigationMenuLink(props: NavigationMenuLinkProps): JSX.Element;
