import Storage from 'expo-sqlite/kv-store';

const PREFIX = 'query-snapshot:';

function storageKey(queryKey: readonly unknown[]) {
  return `${PREFIX}${JSON.stringify(queryKey)}`;
}

/** Last successful result saved for a query key, used as initial data so screens render offline. */
export function readQuerySnapshot<T>(queryKey: readonly unknown[]): T | undefined {
  try {
    const raw = Storage.getItemSync(storageKey(queryKey));

    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeQuerySnapshot(queryKey: readonly unknown[], data: unknown) {
  void Storage.setItemAsync(storageKey(queryKey), JSON.stringify(data)).catch(() => {});
}

export function removeQuerySnapshot(queryKey: readonly unknown[]) {
  void Storage.removeItemAsync(storageKey(queryKey)).catch(() => {});
}

export async function clearQuerySnapshots() {
  const keys = await Storage.getAllKeysAsync().catch(() => [] as string[]);
  await Promise.all(
    keys.filter((key) => key.startsWith(PREFIX)).map((key) => Storage.removeItemAsync(key).catch(() => {}))
  );
}

/**
 * Query options that save each successful result under `queryKey` and start from the saved one, so the screen renders
 * offline. The saved copy counts as stale, so it refetches as soon as the device is online.
 */
export function snapshotQueryOptions<T>(queryKey: readonly unknown[], queryFn: () => Promise<T>) {
  return {
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      writeQuerySnapshot(queryKey, data);

      return data;
    },
    initialData: () => readQuerySnapshot<T>(queryKey),
    initialDataUpdatedAt: 0
  };
}
