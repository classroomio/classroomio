import type { SidePanelDefinition, SidePanelScope } from './types';

class SidePanelStore {
  private definitions = $state<Map<string, SidePanelDefinition>>(new Map());

  activePanelId = $state<string | null>(null);
  panelProps = $state<Record<string, unknown>>({});

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

  open(id: string, props: Record<string, unknown> = {}) {
    if (!this.definitions.has(id)) {
      console.warn(`sidePanel.open: no panel registered with id "${id}"`);

      return;
    }

    this.activePanelId = id;
    this.panelProps = props;
  }

  toggle(id: string, props: Record<string, unknown> = {}) {
    if (this.activePanelId === id) {
      this.close();

      return;
    }

    this.open(id, props);
  }

  close() {
    this.activePanelId = null;
    this.panelProps = {};
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
