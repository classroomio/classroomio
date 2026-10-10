import { WHATS_NEW_ENDPOINT, WHATS_NEW_LAST_SEEN_KEY, countNewEntries } from '../utils/whats-new-utils';
import type { WhatsNewEntry, WhatsNewResponse } from '../utils/types';

class WhatsNewApi {
  entries = $state<WhatsNewEntry[] | null>(null);
  lastSeenAt = $state<string | null>(null);
  isLoading = $state(false);
  isOpen = $state(false);
  private hasRequested = false;

  latestEntry = $derived(this.entries?.[0] ?? null);
  newCount = $derived(this.entries ? countNewEntries(this.entries, this.lastSeenAt) : 0);

  async load() {
    if (this.hasRequested) return;

    this.hasRequested = true;
    this.isLoading = true;
    this.lastSeenAt = this.readLastSeen() ?? this.rememberNow();

    try {
      const response = await fetch(WHATS_NEW_ENDPOINT);

      if (!response.ok) {
        throw new Error(`Changelog request returned ${response.status}`);
      }

      const payload = (await response.json()) as WhatsNewResponse;

      this.entries = payload.entries ?? [];
    } catch (error) {
      console.error('fetching whats new entries error:', error);
      this.entries = [];
    } finally {
      this.isLoading = false;
    }
  }

  open() {
    this.isOpen = true;
    this.markSeen();
  }

  close() {
    this.isOpen = false;
  }

  private markSeen() {
    const newest = this.latestEntry;

    if (!newest) return;

    this.lastSeenAt = newest.publishedAt;
    this.writeLastSeen(newest.publishedAt);
  }

  private rememberNow(): string {
    const now = new Date().toISOString();

    this.writeLastSeen(now);

    return now;
  }

  private readLastSeen(): string | null {
    try {
      return localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY);
    } catch {
      return null;
    }
  }

  private writeLastSeen(value: string) {
    try {
      localStorage.setItem(WHATS_NEW_LAST_SEEN_KEY, value);
    } catch (error) {
      console.error('saving whats new last seen error:', error);
    }
  }
}

export const whatsNewApi = new WhatsNewApi();
