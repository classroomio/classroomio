import type { Tabs } from '$lib/utils/types';
import { Notebook, PresentationFile, Video } from 'carbon-icons-svelte';

interface MaterialTab {
  label: string;
  icon: any;
  value: number;
  badgeValue?: number;
}

export let tabs: MaterialTab[] = [
  {
    label: 'course.navItem.lessons.materials.tabs.note.title',
    icon: Notebook,
    value: 1,
    badgeValue: 0
  },
  {
    label: 'course.navItem.lessons.materials.tabs.slide.title',
    icon: PresentationFile,
    value: 2,
    badgeValue: 0
  },
  {
    label: 'course.navItem.lessons.materials.tabs.video.title',
    icon: Video,
    value: 3,
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

  const filteredReorderedTabs = reorderedTabs.filter((tab) => tab !== undefined);
  return filteredReorderedTabs;
}
