type ResizablePanelDragState = {
  hasDragged: boolean;
  width: number;
};

type StartResizablePanelDragOptions = {
  event: PointerEvent;
  startWidth: number;
  resolveWidth: (params: { startWidth: number; startX: number; currentX: number; deltaX: number }) => number;
  onPreview: (width: number) => void;
  onCommit: (state: ResizablePanelDragState) => void;
  onDragStart?: () => void;
  onDragEnd?: (state: ResizablePanelDragState) => void;
  cursor?: string;
  dragThreshold?: number;
};

export function startResizablePanelDrag({
  event,
  startWidth,
  resolveWidth,
  onPreview,
  onCommit,
  onDragStart,
  onDragEnd,
  cursor = 'col-resize',
  dragThreshold = 3
}: StartResizablePanelDragOptions) {
  const startX = event.clientX;
  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;
  let hasDragged = false;
  let nextWidth = startWidth;
  let animationFrame: number | null = null;
  let hasStopped = false;

  document.body.style.cursor = cursor;
  document.body.style.userSelect = 'none';
  onDragStart?.();

  function flushPreview() {
    animationFrame = null;
    onPreview(nextWidth);
  }

  function schedulePreview() {
    if (animationFrame !== null) {
      return;
    }

    animationFrame = window.requestAnimationFrame(flushPreview);
  }

  function stopResize(shouldCommit: boolean) {
    if (hasStopped) {
      return;
    }

    hasStopped = true;

    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      onPreview(nextWidth);
    }

    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);

    const state = { hasDragged, width: nextWidth };

    if (shouldCommit) {
      onCommit(state);
    }

    onDragEnd?.(state);
  }

  function handlePointerMove(moveEvent: PointerEvent) {
    const deltaX = moveEvent.clientX - startX;
    nextWidth = resolveWidth({
      startWidth,
      startX,
      currentX: moveEvent.clientX,
      deltaX
    });

    if (Math.abs(deltaX) > dragThreshold) {
      hasDragged = true;
    }

    schedulePreview();
  }

  function handlePointerUp() {
    stopResize(true);
  }

  function handlePointerCancel() {
    stopResize(false);
  }

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);

  return () => {
    stopResize(false);
  };
}
