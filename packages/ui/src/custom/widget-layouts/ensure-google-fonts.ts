import { buildWidgetGoogleFontsStylesheetHref, type TWidgetConfig } from '@cio/utils/validation/widget';

const ATTR_PRECONNECT = 'data-cio-widget-font-preconnect';

function ensurePreconnect(head: HTMLHeadElement): void {
  const doc = head.ownerDocument;
  if (!head.querySelector(`link[${ATTR_PRECONNECT}="googleapis"]`)) {
    const a = doc.createElement('link');
    a.rel = 'preconnect';
    a.href = 'https://fonts.googleapis.com';
    a.setAttribute(ATTR_PRECONNECT, 'googleapis');
    head.appendChild(a);
  }
  if (!head.querySelector(`link[${ATTR_PRECONNECT}="gstatic"]`)) {
    const b = doc.createElement('link');
    b.rel = 'preconnect';
    b.href = 'https://fonts.gstatic.com';
    b.setAttribute('crossorigin', '');
    b.setAttribute(ATTR_PRECONNECT, 'gstatic');
    head.appendChild(b);
  }
}

function stylesheetAlreadyPresent(head: HTMLHeadElement, href: string): boolean {
  for (const link of head.querySelectorAll('link[rel="stylesheet"]')) {
    if (link.getAttribute('href') === href) return true;
  }
  return false;
}

/**
 * Idempotently loads Google Fonts for the widget into `document.head` (embed shadow trees share the
 * document’s font cache once the stylesheet is in the main document).
 */
export function ensureWidgetGoogleFontsLoaded(hostElement: HTMLElement, design: TWidgetConfig): void {
  const head = hostElement.ownerDocument?.head;
  if (!head) return;

  ensurePreconnect(head);

  const href = buildWidgetGoogleFontsStylesheetHref(design);
  if (!href || stylesheetAlreadyPresent(head, href)) return;

  const link = hostElement.ownerDocument.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  head.appendChild(link);
}
