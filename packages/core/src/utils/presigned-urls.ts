/**
 * Generic utilities for working with presigned URLs
 * These functions are reusable across multiple services that need to enrich
 * objects with presigned URLs based on keys
 */

/**
 * Extracts keys from an array of objects that have a `key` property
 * @param items Array of objects with a key property
 * @returns Array of string keys
 */
export function extractKeysFromObjects<T extends { key?: string }>(items: T[]): string[] {
  return items.reduce<string[]>((keys, item) => {
    if (item.key) {
      keys.push(item.key);
    }
    return keys;
  }, []);
}

/**
 * Enriches an array of objects with URLs from a key-to-URL mapping
 * Adds a `link` property to objects that have a matching key in the urls record
 * @param items Array of objects to enrich
 * @param urls Record mapping keys to presigned URLs
 * @returns New array with enriched objects (immutable)
 */
export function enrichObjectsWithUrls<T extends { key?: string }>(
  items: T[],
  urls: Record<string, string>
): Array<T & { link?: string }> {
  return items.map((item) => {
    if (item.key && urls[item.key]) {
      return { ...item, link: urls[item.key] };
    }
    return item;
  });
}

/**
 * Generic function to extract keys from objects with a custom key extractor
 * @param items Array of items
 * @param keyExtractor Function to extract the key from an item
 * @returns Array of string keys
 */
export function extractKeysFromArray<T>(items: T[], keyExtractor: (item: T) => string | undefined): string[] {
  return items.reduce<string[]>((keys, item) => {
    const key = keyExtractor(item);
    if (key) {
      keys.push(key);
    }
    return keys;
  }, []);
}

/**
 * Generic function to enrich array items with URLs
 * @param items Array of items to enrich
 * @param urls Record mapping keys to presigned URLs
 * @param keyGetter Function to get the key from an item
 * @param urlSetter Function to set the URL on an item
 * @returns New array with enriched items (immutable)
 */
export function enrichArrayWithUrls<T>(
  items: T[],
  urls: Record<string, string>,
  keyGetter: (item: T) => string | undefined,
  urlSetter: (item: T, url: string) => T
): T[] {
  return items.map((item) => {
    const key = keyGetter(item);
    if (key && urls[key]) {
      return urlSetter(item, urls[key]);
    }
    return item;
  });
}
