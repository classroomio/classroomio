import journal from './_journal.json';

export interface PluginJournalEntry {
  idx: number;
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  path: string;
  activation: {
    kind: 'always' | 'org-capability';
    capabilityId?: string;
    nameKey?: string;
    descriptionKey?: string;
  };
  slots?: string[];
  routes?: string[];
  renderers?: string[];
  pluginNav?: {
    path: string;
    titleKey: string;
    icon?: string;
    group?: string;
    adminOnly?: boolean;
  };
  when: number;
}

export interface PluginJournal {
  version: string;
  dialect: string;
  entries: PluginJournalEntry[];
}

export const pluginJournal = journal as PluginJournal;
