import {
  WHATS_NEW_ENDPOINT,
  WHATS_NEW_SEEN_KEY,
  addSeenId,
  getUnseenEntries,
  parseSeenIds
} from '../utils/whats-new-utils';
import type { WhatsNewEntry, WhatsNewResponse } from '../utils/types';

class WhatsNewApi {
  entries = $state<WhatsNewEntry[] | null>(null);
  seenIds = $state<string[]>([]);
  activeEntry = $state<WhatsNewEntry | null>(null);
  isLoading = $state(false);
  isOpen = $state(false);
  private hasRequested = false;

  unseenEntries = $derived(this.entries ? getUnseenEntries(this.entries, this.seenIds) : []);
  nextEntry = $derived(this.unseenEntries[0] ?? null);

  async load() {
    if (this.hasRequested) return;

    this.hasRequested = true;
    this.isLoading = true;
    this.seenIds = parseSeenIds(this.readStored());

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

  /**
   * Opens the entry the card is showing and marks it seen, so the card moves on to the next unseen entry.
   */
  open() {
    const entry = this.nextEntry;

    if (!entry) return;

    this.activeEntry = entry;
    this.isOpen = true;
    this.seenIds = addSeenId(this.seenIds, entry.id);
    this.writeStored(this.seenIds);
  }

  close() {
    this.isOpen = false;
  }

  private readStored(): string | null {
    try {
      return localStorage.getItem(WHATS_NEW_SEEN_KEY);
    } catch {
      return null;
    }
  }

  private writeStored(ids: string[]) {
    try {
      localStorage.setItem(WHATS_NEW_SEEN_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('saving whats new seen entries error:', error);
    }
  }
}

export const whatsNewApi = new WhatsNewApi();
