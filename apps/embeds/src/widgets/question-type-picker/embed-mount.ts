import '../../embed.css';

import { mount, unmount } from 'svelte';

import Widget from './widget.svelte';

export function mountWidget(target: HTMLElement): { destroy: () => void } {
  target.replaceChildren();
  const instance = mount(Widget, { target });

  return {
    destroy: () => {
      unmount(instance);
    }
  };
}

export function mountAllAuto(targets: readonly HTMLElement[]): void {
  for (const element of targets) {
    mountWidget(element);
  }
}
