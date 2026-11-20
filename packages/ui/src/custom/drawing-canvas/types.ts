export interface DrawingCanvasLabels {
  canvas: string;
  undo: string;
  clear: string;
  save: string;
  saving: string;
}

export const DEFAULT_DRAWING_CANVAS_LABELS: DrawingCanvasLabels = {
  canvas: 'Drawing area',
  undo: 'Undo',
  clear: 'Clear',
  save: 'Save drawing',
  saving: 'Saving…'
};
