import { mount, unmount } from 'svelte';
import type { Component } from 'svelte';

export type MountResult = {
  destroy: () => void;
};

export function mountSvelteComponent<Props extends Record<string, unknown>>(
  target: HTMLElement,
  Component: Component<Props>,
  props?: Props
): MountResult {
  const instance = mount(Component, { target, props: props ?? ({} as Props) });

  return {
    destroy: () => {
      unmount(instance);
    }
  };
}
