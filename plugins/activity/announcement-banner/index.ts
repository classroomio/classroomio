import { definePlugin, type PluginDefinition } from '@cio/sdk';

export interface AnnouncementBannerOptions {
  description?: string;
}

/**
 * Announcement Banner Plugin.
 * Broadcasts org-level alerts, release notes, and notices across the learner LMS header.
 */
export function announcementBanner(options: AnnouncementBannerOptions = {}): PluginDefinition {
  return definePlugin({
    id: 'activity_announcement_banner',
    name: 'Announcement Banner',
    version: '1.0.0',
    category: 'activity',
    activation: {
      kind: 'org-capability',
      capabilityId: 'announcement_banner',
      nameKey: 'plugins.announcement_banner.name',
      descriptionKey: 'plugins.announcement_banner.description'
    },
    description:
      options.description ?? 'Dismissable broadcast banner at the top of the learner LMS for important notices.',
    slots: {
      'lms.banner': () => import('./components/announcement-banner.svelte')
    }
  });
}

export default announcementBanner;
