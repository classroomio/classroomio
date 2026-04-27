import { mount, unmount } from 'svelte';
import { widgetStyles } from '@cio/ui/custom/widget-layouts';

import Widget from './widget.svelte';
import shellCss from './widget.css?raw';

function createShadowHost(target: HTMLElement): { shadowRoot: ShadowRoot; mountPoint: HTMLElement } {
  target.replaceChildren();

  const host = document.createElement('cio-course-widget');
  target.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  const styleElement = document.createElement('style');
  styleElement.textContent = `${shellCss}\n${widgetStyles}`;
  shadowRoot.appendChild(styleElement);

  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  return { shadowRoot, mountPoint };
}

export function mountWidget(
  target: HTMLElement,
  options: { publicKey: string; apiBaseUrl?: string }
): { destroy: () => void } {
  const { mountPoint } = createShadowHost(target);

  const instance = mount(Widget, {
    target: mountPoint,
    props: options
  });

  return {
    destroy: () => {
      unmount(instance);
      target.replaceChildren();
    }
  };
}

export function mountAllAuto(targets: Array<{ element: HTMLElement; publicKey: string; apiBaseUrl?: string }>): void {
  for (const target of targets) {
    mountWidget(target.element, {
      publicKey: target.publicKey,
      apiBaseUrl: target.apiBaseUrl
    });
  }
}
