export interface ProductTourStep {
  id: string;
  target: string;
  title: string;
  body: string;
  hint?: string;
  advanceOnTargetClick?: boolean;
}

export interface ProductTourLabels {
  counter: (position: number, total: number) => string;
  next: string;
  back: string;
  done: string;
  skip: string;
  region: string;
}

export type ProductTourFinishReason = 'done' | 'skipped';
