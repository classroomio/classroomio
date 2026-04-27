const WIDGET_ATTR = 'data-cio-widget';
const WIDGET_VALUE = 'course-widget';
const WIDGET_KEY_ATTR = 'data-widget-key';
const API_BASE_ATTR = 'data-api-base-url';
const LOADING_CLASS = 'cio-embed-loading';
const EMBED_MIN_HEIGHT_PX = 360;

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

let stylesInjected = false;

function injectSpinnerStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const css = `
@keyframes cio-embed-spin { to { transform: rotate(360deg); } }
.${LOADING_CLASS} {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: ${EMBED_MIN_HEIGHT_PX}px;
  padding: 1rem;
  color: oklch(0.556 0 0);
}
.${LOADING_CLASS} svg {
  animation: cio-embed-spin 0.8s linear infinite;
  flex-shrink: 0;
}
`;

  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-cio-embed', 'course-widget-loading');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

const LOADER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4"/><path d="m16.24 7.76 2.83-2.83"/><path d="M22 12h-4"/><path d="m16.24 16.24 2.83 2.83"/><path d="M12 22v-4"/><path d="m7.76 16.24-2.83 2.83"/><path d="M2 12h4"/><path d="m7.76 7.76-2.83-2.83"/></svg>`;

function renderLoading(container: HTMLElement): void {
  injectSpinnerStyles();

  const root = document.createElement('div');
  root.className = LOADING_CLASS;
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-label', 'Loading');
  root.innerHTML = LOADER_SVG;

  container.replaceChildren(root);
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
  renderLoading(element);

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

  for (const target of targets) {
    renderLoading(target.element);
  }

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
