const WIDGET_ATTR = 'data-cio-widget';
const WIDGET_VALUE = 'course-widget';
const WIDGET_KEY_ATTR = 'data-widget-key';
const API_BASE_ATTR = 'data-api-base-url';

export type CourseWidgetEmbedApi = {
  mount: (element: HTMLElement, options: { publicKey: string; apiBaseUrl?: string }) => { destroy: () => void };
};

declare global {
  interface Window {
    CIO?: {
      apiBaseUrl?: string;
      courseWidget?: CourseWidgetEmbedApi;
    };
  }
}

function collectTargets(): Array<{ element: HTMLElement; publicKey: string; apiBaseUrl?: string }> {
  return [...document.querySelectorAll<HTMLElement>(`[${WIDGET_ATTR}="${WIDGET_VALUE}"]`)]
    .map((element) => ({
      element,
      publicKey: element.getAttribute(WIDGET_KEY_ATTR) ?? '',
      apiBaseUrl: element.getAttribute(API_BASE_ATTR) ?? window.CIO?.apiBaseUrl
    }))
    .filter((target) => Boolean(target.publicKey));
}

function scheduleMount(targets: Array<{ element: HTMLElement; publicKey: string; apiBaseUrl?: string }>): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void import('./embed-mount.ts').then((mod) => {
        mod.mountAllAuto(targets);
      });
    });
  });
}

function manualMount(
  element: HTMLElement,
  options: { publicKey: string; apiBaseUrl?: string }
): { destroy: () => void } {
  let cancelled = false;
  let destroyWidget: (() => void) | null = null;

  void import('./embed-mount.ts').then((mod) => {
    if (cancelled) return;
    destroyWidget = mod.mountWidget(element, options).destroy;
  });

  return {
    destroy: () => {
      cancelled = true;
      destroyWidget?.();
      element.replaceChildren();
    }
  };
}

function init(): void {
  const targets = collectTargets();

  window.CIO = window.CIO ?? {};
  window.CIO.courseWidget = {
    mount: manualMount
  };

  scheduleMount(targets);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
