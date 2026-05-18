import { writable } from 'svelte/store';
import { defaultAiTutorSettings, type AiTutorSettings } from '@cio/ai-assistant/tutor-config';

export type AiTutorFormState = AiTutorSettings;

export const orgTutorSettingsStore = writable<AiTutorFormState>({ ...defaultAiTutorSettings });

export interface CourseTutorFormState {
  override: AiTutorSettings;
  inheritFromOrg: boolean;
}

export const courseTutorSettingsStore = writable<CourseTutorFormState>({
  override: { ...defaultAiTutorSettings },
  inheritFromOrg: true
});

export function applyOrgSettings(settings: AiTutorSettings) {
  orgTutorSettingsStore.set({ ...defaultAiTutorSettings, ...settings });
}

export function applyCourseSettings(
  effective: AiTutorSettings,
  override: (Partial<AiTutorSettings> & { inheritFromOrg?: boolean }) | null
) {
  courseTutorSettingsStore.set({
    override: { ...effective, ...(override ?? {}) },
    inheritFromOrg: override?.inheritFromOrg !== false && override == null ? true : (override?.inheritFromOrg ?? false)
  });
}
