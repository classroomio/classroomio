import type { FlashListRef } from '@shopify/flash-list';
import { useEffect, useRef, useState, type RefObject } from 'react';

const HIGHLIGHT_DURATION_MS = 2600;
const SCROLL_POSITION = 0.35;

type RevealOptions<Item> = {
  listRef: RefObject<FlashListRef<Item> | null>;
  data: readonly Item[];
  /** Whether `item` is the one created with `id`. */
  matches: (item: Item, id: string) => boolean;
};

/**
 * Scrolls a list to an item the user just created once it appears in `data`, and reports it as highlighted
 * for a moment so the row can flash.
 */
export function useRevealNewItem<Item>({ listRef, data, matches }: RevealOptions<Item>) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingId) return;

    const index = data.findIndex((item) => matches(item, pendingId));
    if (index < 0) return;

    setPendingId(null);
    setHighlightedId(pendingId);
    requestAnimationFrame(() => {
      void listRef.current?.scrollToIndex({ index, animated: true, viewPosition: SCROLL_POSITION });
    });

    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS);
  }, [pendingId, data, matches, listRef]);

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    []
  );

  return { reveal: (id: string | number) => setPendingId(String(id)), highlightedId };
}
