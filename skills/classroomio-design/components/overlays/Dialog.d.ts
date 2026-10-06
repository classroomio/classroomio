export interface DialogProps {
  open?: boolean; onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode; description?: React.ReactNode;
  children?: React.ReactNode;
  /** right-aligned action row (Buttons) */
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  /** render in-flow without overlay (for previews/docs) */
  inline?: boolean; width?: number|string; style?: React.CSSProperties;
}
/** @startingPoint section="Overlays" subtitle="Modal dialog with header + footer actions" viewport="700x320" */
export declare function Dialog(props: DialogProps): JSX.Element;