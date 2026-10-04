import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AnnouncementSettings {
  backgroundColor: string;
  mode: 'dynamic' | 'custom';
  customMessage: string;
  customLinkText: string;
  customLinkUrl: string;
}

export const DEFAULT_ANNOUNCEMENT_SETTINGS: AnnouncementSettings = {
  backgroundColor: '#2563EB', // ClassroomIO Primary Blue
  mode: 'dynamic',
  customMessage: 'Welcome! Explore newly released courses and interactive training tracks in your academy.',
  customLinkText: 'Explore Courses',
  customLinkUrl: ''
};

export const PRESET_BANNER_COLORS = [
  { label: 'Primary Blue', value: '#2563EB' },
  { label: 'Deep Indigo', value: '#4F46E5' },
  { label: 'Royal Violet', value: '#7C3AED' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Amber Warmth', value: '#D97706' },
  { label: 'Rose Accent', value: '#E11D48' },
  { label: 'Slate Dark', value: '#1E293B' }
];

function getStorageKey(orgId?: string | null) {
  return orgId ? `cio_announcement_settings_${orgId}` : 'cio_announcement_settings_default';
}

export function loadAnnouncementSettings(orgId?: string | null): AnnouncementSettings {
  if (!browser) return DEFAULT_ANNOUNCEMENT_SETTINGS;
  try {
    const raw = localStorage.getItem(getStorageKey(orgId));
    if (raw) {
      return { ...DEFAULT_ANNOUNCEMENT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_ANNOUNCEMENT_SETTINGS;
}

export function createAnnouncementSettingsStore() {
  const store = writable<AnnouncementSettings>(DEFAULT_ANNOUNCEMENT_SETTINGS);

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
    init(orgId?: string | null, serverCustomization?: Partial<AnnouncementSettings> | null) {
      if (
        serverCustomization &&
        typeof serverCustomization === 'object' &&
        Object.keys(serverCustomization).length > 0
      ) {
        store.set({ ...DEFAULT_ANNOUNCEMENT_SETTINGS, ...serverCustomization });
        return;
      }
      const loaded = loadAnnouncementSettings(orgId);
      store.set(loaded);
    },
    save(settings: AnnouncementSettings, orgId?: string | null) {
      store.set(settings);
      if (browser) {
        try {
          localStorage.setItem(getStorageKey(orgId), JSON.stringify(settings));
        } catch {
          // ignore
        }
      }
    }
  };
}

export const announcementSettingsStore = createAnnouncementSettingsStore();

export interface GeneralPluginPreferences {
  focusModeDefault: boolean;
  instantCertDownload: boolean;
}

export const DEFAULT_PLUGIN_PREFERENCES: GeneralPluginPreferences = {
  focusModeDefault: true,
  instantCertDownload: true
};

function getPrefsStorageKey(orgId?: string | null) {
  return orgId ? `cio_plugin_preferences_${orgId}` : 'cio_plugin_preferences_default';
}

export function loadPluginPreferences(orgId?: string | null): GeneralPluginPreferences {
  if (!browser) return DEFAULT_PLUGIN_PREFERENCES;
  try {
    const raw = localStorage.getItem(getPrefsStorageKey(orgId));
    if (raw) {
      return { ...DEFAULT_PLUGIN_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_PLUGIN_PREFERENCES;
}

export function createPluginPreferencesStore() {
  const store = writable<GeneralPluginPreferences>(DEFAULT_PLUGIN_PREFERENCES);

  return {
    subscribe: store.subscribe,
    set: store.set,
    update: store.update,
    init(orgId?: string | null, serverCustomization?: Partial<GeneralPluginPreferences> | null) {
      if (
        serverCustomization &&
        typeof serverCustomization === 'object' &&
        Object.keys(serverCustomization).length > 0
      ) {
        store.set({ ...DEFAULT_PLUGIN_PREFERENCES, ...serverCustomization });
        return;
      }
      const loaded = loadPluginPreferences(orgId);
      store.set(loaded);
    },
    save(prefs: GeneralPluginPreferences, orgId?: string | null) {
      store.set(prefs);
      if (browser) {
        try {
          localStorage.setItem(getPrefsStorageKey(orgId), JSON.stringify(prefs));
        } catch {
          // ignore
        }
      }
    }
  };
}

export const pluginPreferencesStore = createPluginPreferencesStore();
