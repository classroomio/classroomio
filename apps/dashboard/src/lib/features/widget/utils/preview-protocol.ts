import type { TWidgetPayload } from '@cio/utils/validation/widget';

// Parent → iframe messages
export type WidgetPreviewParentMessage =
  | { type: 'WIDGET_PREVIEW_RENDER'; payload: TWidgetPayload; requestId: string }
  | { type: 'WIDGET_PREVIEW_PING' };

// Iframe → parent messages
export type WidgetPreviewIframeMessage =
  | { type: 'WIDGET_PREVIEW_READY'; iframeId: string; timestamp: number }
  | { type: 'WIDGET_PREVIEW_RENDERED'; requestId: string; timestamp: number }
  | { type: 'WIDGET_PREVIEW_ERROR'; requestId: string; error: string; timestamp: number }
  | { type: 'WIDGET_PREVIEW_RESIZE'; height: number };

export type WidgetPreviewMessage = WidgetPreviewParentMessage | WidgetPreviewIframeMessage;

const VALID_PARENT_TYPES = new Set(['WIDGET_PREVIEW_RENDER', 'WIDGET_PREVIEW_PING']);
const VALID_IFRAME_TYPES = new Set([
  'WIDGET_PREVIEW_READY',
  'WIDGET_PREVIEW_RENDERED',
  'WIDGET_PREVIEW_ERROR',
  'WIDGET_PREVIEW_RESIZE'
]);

export function isValidParentMessage(data: unknown): data is WidgetPreviewParentMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false;
  }

  return VALID_PARENT_TYPES.has((data as { type: string }).type);
}

export function isValidIframeMessage(data: unknown): data is WidgetPreviewIframeMessage {
  if (!data || typeof data !== 'object' || !('type' in data)) {
    return false;
  }

  return VALID_IFRAME_TYPES.has((data as { type: string }).type);
}

export function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  const dashboardUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (dashboardUrl) {
    origins.push(dashboardUrl);
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    origins.push(`http://localhost:${window.location.port}`);
  }

  return origins;
}

export function isAllowedOrigin(origin: string): boolean {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    try {
      const url = new URL(origin);
      return url.hostname === 'localhost';
    } catch {
      return false;
    }
  }

  return origin === window.location.origin;
}
