type Style = { style?: React.CSSProperties };
type Kids = { children?: React.ReactNode };
export interface SidebarProviderProps extends Style, Kids { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; }
export interface SidebarProps extends Style, Kids { side?: 'left'|'right'; variant?: 'sidebar'|'floating'|'inset'; collapsible?: 'offcanvas'|'icon'|'none'; /** keep in flow instead of position: fixed */ inline?: boolean; }
export interface SidebarMenuButtonProps extends Style, Kids { isActive?: boolean; variant?: 'default'|'outline'; size?: 'default'|'sm'|'lg'; /** shown on hover only while collapsed to icons */ tooltip?: React.ReactNode; href?: string; disabled?: boolean; onClick?: (e: React.MouseEvent) => void; }
export interface SidebarMenuSubButtonProps extends Style, Kids { isActive?: boolean; size?: 'sm'|'md'; href?: string; onClick?: (e: React.MouseEvent) => void; }
export interface SidebarMenuActionProps extends Style, Kids { showOnHover?: boolean; onClick?: (e: React.MouseEvent) => void; }
export interface SidebarInputProps extends Style { value?: string; defaultValue?: string; placeholder?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; }
export declare function SidebarProvider(props: SidebarProviderProps): JSX.Element;
export declare function Sidebar(props: SidebarProps): JSX.Element;
export declare function SidebarInset(props: Style & Kids): JSX.Element;
export declare function SidebarTrigger(props: Style & { onClick?: (e: React.MouseEvent) => void }): JSX.Element;
export declare function SidebarRail(props: Style): JSX.Element;
export declare function SidebarHeader(props: Style & Kids): JSX.Element;
export declare function SidebarFooter(props: Style & Kids): JSX.Element;
export declare function SidebarContent(props: Style & Kids): JSX.Element;
export declare function SidebarGroup(props: Style & Kids): JSX.Element;
export declare function SidebarGroupLabel(props: Style & Kids): JSX.Element;
export declare function SidebarGroupContent(props: Style & Kids): JSX.Element;
export declare function SidebarGroupAction(props: Style & Kids & { onClick?: (e: React.MouseEvent) => void }): JSX.Element;
export declare function SidebarMenu(props: Style & Kids): JSX.Element;
export declare function SidebarMenuItem(props: Style & Kids): JSX.Element;
export declare function SidebarMenuButton(props: SidebarMenuButtonProps): JSX.Element;
export declare function SidebarMenuAction(props: SidebarMenuActionProps): JSX.Element;
export declare function SidebarMenuBadge(props: Style & Kids): JSX.Element;
export declare function SidebarMenuSkeleton(props: Style & { showIcon?: boolean }): JSX.Element;
export declare function SidebarMenuSub(props: Style & Kids): JSX.Element;
export declare function SidebarMenuSubItem(props: Style & Kids): JSX.Element;
export declare function SidebarMenuSubButton(props: SidebarMenuSubButtonProps): JSX.Element;
export declare function SidebarSeparator(props: Style): JSX.Element;
export declare function SidebarInput(props: SidebarInputProps): JSX.Element;
