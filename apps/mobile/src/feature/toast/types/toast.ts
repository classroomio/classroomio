export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

export type ToastMessage = ToastInput & { id: number; tone: ToastTone; duration: number };
