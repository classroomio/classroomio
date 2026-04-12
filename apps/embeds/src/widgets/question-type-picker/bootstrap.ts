const WIDGET_ATTR = 'data-cio-widget';
const WIDGET_VALUE = 'question-type-picker';
const LOADING_CLASS = 'cio-embed-loading';

/** Must stay in sync with `QuestionTypePicker` outer `min-h-[320px]` so the embed does not jump after load. */
const EMBED_MIN_HEIGHT_PX = 320;

export type QuestionTypePickerEmbedApi = {
  mount: (element: HTMLElement) => { destroy: () => void };
};

declare global {
  interface Window {
    CIO?: {
      questionTypePicker?: QuestionTypePickerEmbedApi;
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
  styleEl.setAttribute('data-cio-embed', 'question-type-picker-loading');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

/** 16×16 — same multi-segment loader as `@cio/ui` Spinner (Lucide Loader, `size-4`). */
const LOADER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4"/><path d="m16.24 7.76 2.83-2.83"/><path d="M22 12h-4"/><path d="m16.24 16.24 2.83 2.83"/><path d="M12 22v-4"/><path d="m7.76 16.24-2.83 2.83"/><path d="M2 12h4"/><path d="m7.76 7.76-2.83-2.83"/></svg>`;

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

function collectTargets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`[${WIDGET_ATTR}="${WIDGET_VALUE}"]`)];
}

function scheduleMount(targets: HTMLElement[]): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void import('./embed-mount.ts').then((mod) => {
        mod.mountAllAuto(targets);
      });
    });
  });
}

function manualMount(element: HTMLElement): { destroy: () => void } {
  renderLoading(element);

  let cancelled = false;
  let destroyWidget: (() => void) | null = null;

  void import('./embed-mount.ts').then((mod) => {
    if (cancelled) return;
    destroyWidget = mod.mountWidget(element).destroy;
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

  for (const element of targets) {
    renderLoading(element);
  }

  window.CIO = window.CIO ?? {};
  window.CIO.questionTypePicker = {
    mount: manualMount
  };

  scheduleMount(targets);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
