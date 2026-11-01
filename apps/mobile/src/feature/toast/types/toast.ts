export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

export type ToastAction = {
  label: string;
  onPress: () => void;
};

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
  /** A single text button, such as Undo. Pressing it runs `onPress` and dismisses the toast. */
  action?: ToastAction;
};

export type ToastMessage = ToastInput & { id: number; tone: ToastTone; duration: number };
