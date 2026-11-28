import { describe, expect, it } from 'vitest';
import { TABS_MAX_TABS, ZTabsBlockData } from '@cio/utils/validation/block';
import {
  addTab,
  createExampleTabs,
  removeTab,
  setTabMedia,
  setTabName,
  setTabNote,
  setTabsAlignment
} from './tabs-utils';

const EXAMPLES = [
  { name: 'Overview', note: 'What this covers.' },
  { name: 'Setup', note: 'What you need.' }
];

describe('tabs utils', () => {
  it('creates valid centred example tabs with one tab per example', () => {
    const tabs = createExampleTabs(EXAMPLES);

    expect(tabs.align).toBe('center');
    expect(tabs.tabs.map((tab) => tab.name)).toEqual(['Overview', 'Setup']);
    expect(ZTabsBlockData.safeParse(tabs).success).toBe(true);
  });

  it('edits only the targeted tab and keeps the rest', () => {
    const tabs = createExampleTabs(EXAMPLES);
    const [first, second] = tabs.tabs;
    const edited = setTabNote(setTabName(tabs, first.id, 'Intro'), first.id, 'Start here.');

    expect(edited.tabs[0]).toEqual({ id: first.id, name: 'Intro', note: 'Start here.' });
    expect(edited.tabs[1]).toEqual(second);
    expect(setTabsAlignment(edited, 'right').align).toBe('right');
  });

  it('adds a named tab with an empty note and stops at the maximum', () => {
    const tabs = addTab(createExampleTabs(EXAMPLES), 'New tab');

    expect(tabs.tabs.at(-1)).toMatchObject({ name: 'New tab', note: '' });
    expect(ZTabsBlockData.safeParse(tabs).success).toBe(true);

    let full = tabs;
    while (full.tabs.length < TABS_MAX_TABS) full = addTab(full, 'New tab');

    expect(addTab(full, 'New tab')).toBe(full);
  });

  it('removes a tab but never the last one', () => {
    const tabs = createExampleTabs(EXAMPLES);
    const single = removeTab(tabs, tabs.tabs[0].id);

    expect(single.tabs.map((tab) => tab.name)).toEqual(['Setup']);
    expect(removeTab(single, single.tabs[0].id)).toBe(single);
  });

  it('sets, replaces and clears the one image or video of a tab without touching the others', () => {
    const tabs = createExampleTabs(EXAMPLES);
    const [first, second] = tabs.tabs;
    const withImage = setTabMedia(tabs, first.id, { kind: 'image', data: { url: 'https://example.com/a.png' } });
    const withVideo = setTabMedia(withImage, first.id, {
      kind: 'video',
      data: { type: 'youtube', link: 'https://youtu.be/x' }
    });
    const cleared = setTabMedia(withVideo, first.id, null);

    expect(withImage.tabs[0].media).toEqual({ kind: 'image', data: { url: 'https://example.com/a.png' } });
    expect(withVideo.tabs[0].media?.kind).toBe('video');
    expect(ZTabsBlockData.safeParse(withVideo).success).toBe(true);
    expect('media' in cleared.tabs[0]).toBe(false);
    expect(cleared.tabs[1]).toEqual(second);
  });
});
