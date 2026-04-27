import type { SearchResultItem, SearchScope } from './types';

const MAX_RECENT_ITEMS = 8;
const STORAGE_PREFIX = 'cio:search:recents';

type StoredSearchResultItem = Omit<SearchResultItem, 'icon'>;

function getStorageKey(orgId: string, scope: SearchScope) {
  return `${STORAGE_PREFIX}:${scope}:${orgId}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getRecents(orgId?: string | null, scope: SearchScope = 'org'): SearchResultItem[] {
  if (!orgId || !canUseStorage()) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(getStorageKey(orgId, scope));
    if (!storedValue) {
      return [];
    }

    return JSON.parse(storedValue) as StoredSearchResultItem[];
  } catch (error) {
    console.error('getRecents error:', error);
    return [];
  }
}

export function addRecent(orgId: string | null | undefined, item: SearchResultItem, scope: SearchScope = 'org') {
  if (!orgId || !canUseStorage()) {
    return;
  }

  try {
    const { icon: _icon, ...storedItem } = item;
    const existingItems = getRecents(orgId, scope);
    const nextItems = [
      storedItem,
      ...existingItems.filter((existingItem) => existingItem.id !== item.id || existingItem.kind !== item.kind)
    ].slice(0, MAX_RECENT_ITEMS);

    window.localStorage.setItem(getStorageKey(orgId, scope), JSON.stringify(nextItems));
  } catch (error) {
    console.error('addRecent error:', error);
  }
}

export function clearRecents(orgId?: string | null, scope: SearchScope = 'org') {
  if (!orgId || !canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(getStorageKey(orgId, scope));
}
