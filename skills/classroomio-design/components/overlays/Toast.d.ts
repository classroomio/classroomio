export interface ToastAction { label: React.ReactNode; onClick?: () => void; }
export interface ToastProps { type?: 'default'|'success'|'error'|'warning'|'info'|'loading'; title: React.ReactNode; description?: React.ReactNode; action?: ToastAction; cancel?: ToastAction; closeButton?: boolean; onClose?: () => void; style?: React.CSSProperties; }
export interface ToastOptions { id?: string|number; description?: React.ReactNode; action?: ToastAction; cancel?: ToastAction; /** ms; Infinity keeps it open */ duration?: number; }
export interface ToasterProps { position?: 'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'; closeButton?: boolean; /** position absolutely inside a relative parent instead of fixed to the viewport */ inline?: boolean; style?: React.CSSProperties; }
export declare function Toast(props: ToastProps): JSX.Element;
export declare function Toaster(props: ToasterProps): JSX.Element;
export declare const toast: {
  (title: React.ReactNode, opts?: ToastOptions): string|number;
  success(title: React.ReactNode, opts?: ToastOptions): string|number;
  error(title: React.ReactNode, opts?: ToastOptions): string|number;
  warning(title: React.ReactNode, opts?: ToastOptions): string|number;
  info(title: React.ReactNode, opts?: ToastOptions): string|number;
  loading(title: React.ReactNode, opts?: ToastOptions): string|number;
  dismiss(id?: string|number): void;
};
