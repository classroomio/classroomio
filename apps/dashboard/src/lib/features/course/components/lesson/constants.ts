import BookOpenIcon from '@lucide/svelte/icons/book-open';
import type { Component } from 'svelte';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import type { Tabs } from '$features/course/utils/types';
import VideoIcon from '@lucide/svelte/icons/video';

interface MaterialTab {
  label: string;
  icon: Component;
  value: number;
  badgeValue?: number;
}

export const tabs: MaterialTab[] = [
  {
    label: 'course.navItem.lessons.materials.tabs.note.title',
    icon: BookOpenIcon,
    value: 1,
    badgeValue: 0
  },
  {
    label: 'course.navItem.lessons.materials.tabs.slide.title',
    icon: PresentationIcon,
    value: 2,
    badgeValue: 0
  },
  {
    label: 'course.navItem.lessons.materials.tabs.video.title',
    icon: VideoIcon,
    value: 3,
    badgeValue: 0
  },
  {
    label: 'course.navItem.lessons.materials.tabs.document.title',
    icon: FileTextIcon,
    value: 4,
    badgeValue: 0
  }
];

export function orderedTabs(tabs: MaterialTab[], settingTabs?: Tabs[]) {
  if (!Array.isArray(settingTabs)) return tabs;

  const reorderedTabs: MaterialTab[] = [];

  const tabMap = new Map(tabs.map((tab) => [tab.value, tab]));

  settingTabs.forEach((settingTab, index) => {
    const tab = tabMap.get(settingTab.id);
    if (tab) {
      reorderedTabs[index] = tab;
    }
  });

  return reorderedTabs.filter((tab) => tab !== undefined);
}
