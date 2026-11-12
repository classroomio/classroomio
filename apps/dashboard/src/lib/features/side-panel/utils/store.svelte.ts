import { browser } from '$app/environment';
import { isMobileStore } from '@cio/ui/hooks/is-mobile.svelte';
import type { SidePanelDefinition, SidePanelFloatingRect, SidePanelMode, SidePanelScope } from './types';
import {
  clampFloatingRect,
  getDefaultFloatingRect,
  getViewport,
  readFloatingState,
  writeFloatingState
} from './floating';

class SidePanelStore {
  private definitions = $state<Map<string, SidePanelDefinition>>(new Map());

  activePanelId = $state<string | null>(null);
  panelProps = $state<Record<string, unknown>>({});
  width = $state(0);
  mode = $state<SidePanelMode>('docked');
  floatingRect = $state<SidePanelFloatingRect | null>(null);
  isFloatingDragging = $state(false);
  showDockHint = $state(false);

  register(definition: SidePanelDefinition) {
    this.definitions.set(definition.id, definition);
  }

  list(): SidePanelDefinition[] {
    return Array.from(this.definitions.values());
  }

  get(id: string): SidePanelDefinition | undefined {
    return this.definitions.get(id);
  }

  get activeDefinition(): SidePanelDefinition | null {
    if (!this.activePanelId) return null;

    return this.definitions.get(this.activePanelId) ?? null;
  }

  get isFloating(): boolean {
    const def = this.activeDefinition;
    return this.mode === 'floating' && Boolean(def?.floatable) && !isMobileStore.current;
  }

  private ensureFloatingRect(def: SidePanelDefinition): SidePanelFloatingRect {
    if (this.floatingRect) {
      const viewport = getViewport();
      return clampFloatingRect(this.floatingRect, def, viewport);
    }

    const state = readFloatingState(def);
    if (state?.rect) {
      const viewport = getViewport();
      return clampFloatingRect(state.rect, def, viewport);
    }

    const viewport = getViewport();
    return getDefaultFloatingRect(def, viewport);
  }

  private persistFloatingState(def: SidePanelDefinition) {
    if (!def.floatingStorageKey) return;
    if (!this.floatingRect) return;

    writeFloatingState(def, { rect: this.floatingRect });
  }

  open(id: string, props: Record<string, unknown> = {}) {
    if (!this.definitions.has(id)) {
      console.warn(`sidePanel.open: no panel registered with id "${id}"`);

      return;
    }

    const def = this.definitions.get(id);
    this.activePanelId = id;
    this.panelProps = props;
    this.mode = 'docked';
    this.floatingRect = null;

    if (def?.floatable && browser) {
      this.floatingRect = this.ensureFloatingRect(def);
    }

    this.isFloatingDragging = false;
    this.showDockHint = false;
  }

  openFloating(id: string, props: Record<string, unknown> = {}) {
    if (!this.definitions.has(id)) {
      console.warn(`sidePanel.openFloating: no panel registered with id "${id}"`);

      return;
    }

    const def = this.definitions.get(id)!;
    if (!def.floatable || !browser) {
      this.open(id, props);
      return;
    }

    this.activePanelId = id;
    this.panelProps = props;
    this.mode = 'floating';
    this.floatingRect = this.ensureFloatingRect(def);
    this.isFloatingDragging = false;
    this.showDockHint = false;
    this.persistFloatingState(def);
  }

  toggle(id: string, props: Record<string, unknown> = {}) {
    if (this.activePanelId === id) {
      this.close();

      return;
    }

    this.open(id, props);
  }

  toggleFloating(id: string, props: Record<string, unknown> = {}) {
    if (this.activePanelId === id && this.isFloating) {
      this.close();
      return;
    }

    this.openFloating(id, props);
  }

  setMode(mode: SidePanelMode) {
    const def = this.activeDefinition;
    if (!def) return;
    if (mode === 'floating' && !def.floatable) return;

    if (mode === 'floating') {
      this.floatingRect = this.ensureFloatingRect(def);
    }

    this.mode = mode;
    this.isFloatingDragging = false;
    this.showDockHint = false;
    this.persistFloatingState(def);
  }

  dock() {
    this.setMode('docked');
  }

  updateFloatingRect(rect: SidePanelFloatingRect, persist = false) {
    this.floatingRect = rect;
    if (!persist) return;

    const def = this.activeDefinition;
    if (!def) return;

    this.persistFloatingState(def);
  }

  close() {
    this.activePanelId = null;
    this.panelProps = {};
    this.width = 0;
    this.isFloatingDragging = false;
    this.showDockHint = false;
  }

  closeIfScope(scope: SidePanelScope) {
    if (!this.activePanelId) return;

    const def = this.definitions.get(this.activePanelId);
    if (!def) return;

    if (def.scope === scope) {
      this.close();
    }
  }

  reset() {
    this.close();
  }
}

export const sidePanel = new SidePanelStore();
