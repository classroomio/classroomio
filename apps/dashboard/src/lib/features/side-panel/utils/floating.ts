import type { SidePanelDefinition, SidePanelFloatingRect, SidePanelMode } from './types';

export const FLOATING_WINDOW_MARGIN = 12;
export const FLOATING_WINDOW_DOCK_THRESHOLD = 56;
export const DEFAULT_FLOATING_WIDTH = 368;
export const DEFAULT_FLOATING_HEIGHT = 560;
export const MIN_FLOATING_WIDTH = 320;
export const MIN_FLOATING_HEIGHT = 380;
export const SSR_VIEWPORT = { width: 1280, height: 800 } as const;
export const ROOT_FONT_FALLBACK = 16;

export interface FloatingViewport {
  width: number;
  height: number;
}

export interface FloatingState {
  mode?: SidePanelMode;
  rect: SidePanelFloatingRect;
}

function getRootFontSizePx(): number {
  if (typeof window === 'undefined') return ROOT_FONT_FALLBACK;

  const fontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize : ROOT_FONT_FALLBACK;
}

function getDefaultDimensions(def: SidePanelDefinition) {
  const defaultWidth =
    def.defaultFloatingWidthRem != null
      ? def.defaultFloatingWidthRem * getRootFontSizePx()
      : (def.defaultFloatingWidth ?? DEFAULT_FLOATING_WIDTH);
  const defaultHeight = def.defaultFloatingHeight ?? DEFAULT_FLOATING_HEIGHT;

  return { defaultWidth, defaultHeight };
}

function getMinDimensions(def: SidePanelDefinition) {
  return {
    minWidth: def.minFloatingWidth ?? MIN_FLOATING_WIDTH,
    minHeight: def.minFloatingHeight ?? MIN_FLOATING_HEIGHT
  };
}

export function getDefaultFloatingRect(def: SidePanelDefinition, viewport: FloatingViewport): SidePanelFloatingRect {
  const { defaultWidth, defaultHeight } = getDefaultDimensions(def);
  const { minWidth, minHeight } = getMinDimensions(def);
  const maxWidth = Math.max(0, viewport.width - FLOATING_WINDOW_MARGIN * 2);
  const maxHeight = Math.max(0, viewport.height - FLOATING_WINDOW_MARGIN * 2);
  let width = Math.min(defaultWidth, maxWidth);
  let height = Math.min(defaultHeight, maxHeight);
  if (maxWidth >= minWidth) width = Math.max(width, minWidth);
  if (maxHeight >= minHeight) height = Math.max(height, minHeight);
  const x = Math.max(FLOATING_WINDOW_MARGIN, viewport.width - width - FLOATING_WINDOW_MARGIN);
  const y = Math.max(FLOATING_WINDOW_MARGIN, viewport.height - height - FLOATING_WINDOW_MARGIN);

  return { x, y, width, height };
}

export function clampFloatingRect(
  rect: SidePanelFloatingRect,
  def: SidePanelDefinition,
  viewport: FloatingViewport
): SidePanelFloatingRect {
  const { minWidth, minHeight } = getMinDimensions(def);
  const maxWidth = Math.max(0, viewport.width - FLOATING_WINDOW_MARGIN * 2);
  const maxHeight = Math.max(0, viewport.height - FLOATING_WINDOW_MARGIN * 2);
  let width = Math.min(rect.width, maxWidth);
  let height = Math.min(rect.height, maxHeight);
  if (maxWidth >= minWidth) width = Math.max(width, minWidth);
  if (maxHeight >= minHeight) height = Math.max(height, minHeight);
  const maxX = Math.max(FLOATING_WINDOW_MARGIN, viewport.width - width - FLOATING_WINDOW_MARGIN);
  const maxY = Math.max(FLOATING_WINDOW_MARGIN, viewport.height - height - FLOATING_WINDOW_MARGIN);
  const x = Math.min(maxX, Math.max(FLOATING_WINDOW_MARGIN, rect.x));
  const y = Math.min(maxY, Math.max(FLOATING_WINDOW_MARGIN, rect.y));

  return { x, y, width, height };
}

export function isNearDockEdge(clientX: number, viewportWidth: number): boolean {
  if (!Number.isFinite(clientX) || !Number.isFinite(viewportWidth)) return false;

  return clientX > viewportWidth - FLOATING_WINDOW_DOCK_THRESHOLD;
}

export function getViewport(): FloatingViewport {
  if (typeof window === 'undefined') {
    return { ...SSR_VIEWPORT };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

function getStorageKey(def: SidePanelDefinition): string | null {
  return def.floatingStorageKey ?? null;
}

export function readFloatingState(def: SidePanelDefinition): FloatingState | null {
  const key = getStorageKey(def);
  if (!key) return null;
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FloatingState>;
    if (!parsed.rect || typeof parsed.rect !== 'object') return null;

    const rect = parsed.rect as SidePanelFloatingRect;
    if (
      typeof rect.x !== 'number' ||
      !Number.isFinite(rect.x) ||
      typeof rect.y !== 'number' ||
      !Number.isFinite(rect.y) ||
      typeof rect.width !== 'number' ||
      !Number.isFinite(rect.width) ||
      rect.width <= 0 ||
      typeof rect.height !== 'number' ||
      !Number.isFinite(rect.height) ||
      rect.height <= 0
    ) {
      return null;
    }

    if (rect.x === 0 && rect.y === 0) return null;

    const mode = parsed.mode === 'docked' || parsed.mode === 'floating' ? parsed.mode : undefined;

    return { mode, rect };
  } catch {
    return null;
  }
}

export function writeFloatingState(def: SidePanelDefinition, state: FloatingState): void {
  const key = getStorageKey(def);
  if (!key) return;
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

export function readFloatingRect(def: SidePanelDefinition): SidePanelFloatingRect | null {
  return readFloatingState(def)?.rect ?? null;
}

export function writeFloatingRect(def: SidePanelDefinition, rect: SidePanelFloatingRect): void {
  writeFloatingState(def, { rect });
}

function createInteractionSession(cursor: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;
  document.body.style.cursor = cursor;
  document.body.style.userSelect = 'none';

  let frame: number | null = null;
  let hasStopped = false;

  return {
    get hasStopped() {
      return hasStopped;
    },
    set hasStopped(value: boolean) {
      hasStopped = value;
    },
    get frame() {
      return frame;
    },
    set frame(value: number | null) {
      frame = value;
    },
    restore() {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    },
    request(flush: () => void) {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        flush();
      });
    },
    cancel() {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    },
    addListeners(move: (event: PointerEvent) => void, up: () => void, cancel: () => void) {
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    },
    removeListeners(move: (event: PointerEvent) => void, up: () => void, cancel: () => void) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    }
  };
}

export interface StartFloatingDragOptions {
  event: PointerEvent;
  rect: SidePanelFloatingRect;
  definition: SidePanelDefinition;
  onPreview: (rect: SidePanelFloatingRect) => void;
  onCommit: (rect: SidePanelFloatingRect, shouldDock: boolean) => void;
  onDockHintChange?: (show: boolean) => void;
  onCancel?: () => void;
}

export function startFloatingDrag(options: StartFloatingDragOptions): () => void {
  const session = createInteractionSession('grabbing');
  if (!session) return () => {};

  const { event, rect, definition, onPreview, onCommit, onDockHintChange } = options;
  const startX = event.clientX;
  const startY = event.clientY;
  const originX = rect.x;
  const originY = rect.y;
  let activeRect = rect;
  let shouldDock = false;
  let queuedRect: SidePanelFloatingRect | null = null;
  let queuedDock = false;

  function flushPreview() {
    if (queuedRect) {
      onPreview(queuedRect);
      activeRect = queuedRect;
      queuedRect = null;
    }

    if (onDockHintChange) onDockHintChange(queuedDock);
    shouldDock = queuedDock;
  }

  function schedulePreview(nextRect: SidePanelFloatingRect, dock: boolean) {
    queuedRect = nextRect;
    queuedDock = dock;
    session!.request(flushPreview);
  }

  function stop(shouldCommit: boolean) {
    if (session!.hasStopped) return;

    session!.hasStopped = true;
    session!.cancel();
    if (queuedRect) {
      onPreview(queuedRect);
      activeRect = queuedRect;
    }

    if (onDockHintChange) onDockHintChange(queuedDock);
    shouldDock = queuedDock;
    session!.restore();
    session!.removeListeners(handlePointerMove, handlePointerUp, handlePointerCancel);
    if (onDockHintChange) onDockHintChange(false);

    if (shouldCommit) {
      onCommit(activeRect, shouldDock);
    } else {
      options.onCancel?.();
    }
  }

  function handlePointerMove(moveEvent: PointerEvent) {
    const nextX = originX + moveEvent.clientX - startX;
    const nextY = originY + moveEvent.clientY - startY;
    const viewport = getViewport();
    const nextRect = { x: nextX, y: nextY, width: activeRect.width, height: activeRect.height };
    const clamped = clampFloatingRect(nextRect, definition, viewport);
    const dock = isNearDockEdge(moveEvent.clientX, viewport.width);
    schedulePreview(clamped, dock);
  }

  function handlePointerUp() {
    stop(true);
  }

  function handlePointerCancel() {
    stop(false);
  }

  session.addListeners(handlePointerMove, handlePointerUp, handlePointerCancel);

  return () => stop(false);
}

export interface StartFloatingResizeOptions {
  event: PointerEvent;
  rect: SidePanelFloatingRect;
  definition: SidePanelDefinition;
  onPreview: (rect: SidePanelFloatingRect) => void;
  onCommit: (rect: SidePanelFloatingRect) => void;
  onCancel?: () => void;
}

export function startFloatingResize(options: StartFloatingResizeOptions): () => void {
  const session = createInteractionSession('nwse-resize');
  if (!session) return () => {};

  const { event, rect, definition, onPreview, onCommit } = options;
  const startX = event.clientX;
  const startY = event.clientY;
  const originWidth = rect.width;
  const originHeight = rect.height;
  const originX = rect.x;
  const originY = rect.y;
  let activeRect = rect;
  let queuedRect: SidePanelFloatingRect | null = null;

  function flushPreview() {
    if (queuedRect) {
      onPreview(queuedRect);
      activeRect = queuedRect;
      queuedRect = null;
    }
  }

  function schedulePreview(nextRect: SidePanelFloatingRect) {
    queuedRect = nextRect;
    session!.request(flushPreview);
  }

  function stop(shouldCommit: boolean) {
    if (session!.hasStopped) return;

    session!.hasStopped = true;
    session!.cancel();
    if (queuedRect) {
      onPreview(queuedRect);
      activeRect = queuedRect;
    }

    session!.restore();
    session!.removeListeners(handlePointerMove, handlePointerUp, handlePointerCancel);

    if (shouldCommit) {
      onCommit(activeRect);
    } else {
      options.onCancel?.();
    }
  }

  function handlePointerMove(moveEvent: PointerEvent) {
    const deltaX = moveEvent.clientX - startX;
    const deltaY = moveEvent.clientY - startY;
    const viewport = getViewport();
    const { minWidth, minHeight } = getMinDimensions(definition);
    const maxWidth = Math.max(minWidth, viewport.width - originX - FLOATING_WINDOW_MARGIN);
    const maxHeight = Math.max(minHeight, viewport.height - originY - FLOATING_WINDOW_MARGIN);
    const width = Math.min(maxWidth, Math.max(minWidth, originWidth + deltaX));
    const height = Math.min(maxHeight, Math.max(minHeight, originHeight + deltaY));
    const nextRect = { x: originX, y: originY, width, height };
    const clamped = clampFloatingRect(nextRect, definition, viewport);
    schedulePreview(clamped);
  }

  function handlePointerUp() {
    stop(true);
  }

  function handlePointerCancel() {
    stop(false);
  }

  session.addListeners(handlePointerMove, handlePointerUp, handlePointerCancel);

  return () => stop(false);
}
