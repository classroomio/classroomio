import * as CONSTANTS from './constants';

import type { Component } from 'svelte';
import Document from './document/document.svelte';
import Note from './note/note.svelte';
import Slide from './slide/slide.svelte';
import Video from './video/video.svelte';

export function getViewModeComponents(tabs = CONSTANTS.tabs): Component[] {
  const componentMap: Record<number, Component> = {
    1: Note,
    2: Slide,
    3: Video,
    4: Document
  };

  const componentNames = tabs
    .map((tab) => {
      const component = componentMap[tab.value];
      return component || null;
    })
    .filter((component): component is Component => component !== null);

  return componentNames;
}
