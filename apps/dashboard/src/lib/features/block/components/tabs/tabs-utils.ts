import {
  TABS_MAX_TABS,
  TABS_MIN_TABS,
  type TTabMedia,
  type TTabsAlignment,
  type TTabsBlockData
} from '@cio/utils/validation/block';

export interface TabExampleCopy {
  name: string;
  note: string;
}

export function createTabId(): string {
  return crypto.randomUUID();
}

/**
 * The tabs a menu click inserts, centred, one tab per example.
 */
export function createExampleTabs(copy: TabExampleCopy[]): TTabsBlockData {
  const tabs = copy.map((example) => ({ id: createTabId(), name: example.name, note: example.note }));

  return { align: 'center', tabs };
}

export function setTabName(data: TTabsBlockData, tabId: string, name: string): TTabsBlockData {
  const tabs = data.tabs.map((tab) => (tab.id === tabId ? { ...tab, name } : tab));

  return { ...data, tabs };
}

export function setTabNote(data: TTabsBlockData, tabId: string, note: string): TTabsBlockData {
  const tabs = data.tabs.map((tab) => (tab.id === tabId ? { ...tab, note } : tab));

  return { ...data, tabs };
}

/**
 * Sets the one image or video a tab shows, replacing what it had; null clears it.
 */
export function setTabMedia(data: TTabsBlockData, tabId: string, media: TTabMedia | null): TTabsBlockData {
  const tabs = data.tabs.map((tab) => {
    if (tab.id !== tabId) return tab;

    const { media: _previous, ...rest } = tab;

    return media ? { ...rest, media } : rest;
  });

  return { ...data, tabs };
}

export function setTabsAlignment(data: TTabsBlockData, align: TTabsAlignment): TTabsBlockData {
  return { ...data, align };
}

/**
 * Appends a tab with an empty note. The block is returned unchanged once it holds the maximum.
 */
export function addTab(data: TTabsBlockData, name: string): TTabsBlockData {
  if (data.tabs.length >= TABS_MAX_TABS) return data;

  const tab = { id: createTabId(), name, note: '' };

  return { ...data, tabs: [...data.tabs, tab] };
}

/**
 * Removes one tab with its image or video. The block is returned unchanged when it is already at the minimum.
 */
export function removeTab(data: TTabsBlockData, tabId: string): TTabsBlockData {
  if (data.tabs.length <= TABS_MIN_TABS) return data;

  const tabs = data.tabs.filter((tab) => tab.id !== tabId);

  return { ...data, tabs };
}
