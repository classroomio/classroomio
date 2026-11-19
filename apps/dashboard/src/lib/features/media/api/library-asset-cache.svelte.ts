import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

import type { OrganizationAsset } from '../utils/types';
import { mediaApi } from './media-manager.svelte';

/**
 * Library assets shown outside the Media page, keyed by asset id, so every surface that renders the same asset
 * reads one live copy and updates together when it is edited.
 */
export class LibraryAssetCache {
  private assets = new SvelteMap<string, OrganizationAsset>();
  private pendingLoads = new SvelteMap<string, Promise<OrganizationAsset | null>>();

  get(assetId: string): OrganizationAsset | undefined {
    return this.assets.get(assetId);
  }

  set(asset: OrganizationAsset) {
    this.assets.set(asset.id, asset);
  }

  /** Loads the asset only when it is not cached yet. Safe to call from an effect. */
  ensureLoaded(assetId: string) {
    const isCached = untrack(() => this.assets.has(assetId));
    if (isCached) return;

    void this.load(assetId);
  }

  /** Fetches the asset from the server and stores it. Concurrent calls for the same asset share one request. */
  load(assetId: string): Promise<OrganizationAsset | null> {
    const pendingLoad = untrack(() => this.pendingLoads.get(assetId));
    if (pendingLoad) return pendingLoad;

    const load = mediaApi
      .refreshAsset(assetId)
      .then((asset) => {
        if (asset) this.set(asset);

        return asset;
      })
      .finally(() => {
        this.pendingLoads.delete(assetId);
      });
    this.pendingLoads.set(assetId, load);

    return load;
  }
}

export const libraryAssetCache = new LibraryAssetCache();
