import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import type { HostInstance, ScrollViewInstance } from 'react-native';

const HIGHLIGHT_DURATION_MS = 2600;
const TOP_MARGIN = 96;

let pending: { courseId: string; postId: string } | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Asks the course screen to scroll to and flash a post once it shows up in the feed. */
export function revealAnnouncement(courseId: string, postId: string) {
  pending = { courseId, postId };
  emit();
}

/**
 * Scrolls the course screen to an announcement posted from the compose sheet once the refreshed feed contains it,
 * and reports it as highlighted for a moment. Attach `postRef(id)` to each post's wrapper.
 */
export function useRevealAnnouncement(
  courseId: string,
  postIds: readonly string[],
  scrollRef: RefObject<ScrollViewInstance | null>
) {
  const target = useSyncExternalStore(subscribe, () => (pending?.courseId === courseId ? pending.postId : null));
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const nodes = useRef(new Map<string, HostInstance>());
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = target !== null && postIds.includes(target);

  useEffect(() => {
    if (!ready || !target) return;

    pending = null;
    emit();
    setHighlightedId(target);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS);

    requestAnimationFrame(() => {
      const scroll = scrollRef.current;
      const content = scroll?.getInnerViewRef();
      const node = nodes.current.get(target);
      if (!scroll || !content || !node) return;

      node.measureLayout(content, (_x, y) => scroll.scrollTo({ y: Math.max(0, y - TOP_MARGIN), animated: true }));
    });
  }, [ready, target, scrollRef]);

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    []
  );

  const postRef = (postId: string) => (node: HostInstance | null) => {
    if (node) nodes.current.set(postId, node);
    else nodes.current.delete(postId);
  };

  return { highlightedId, postRef };
}
