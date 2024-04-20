import { Video, Notebook, PresentationFile } from 'carbon-icons-svelte';

export let tabs = [
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

export function orderedTabs(tabs, settingTabs) {
  if (!Array.isArray(settingTabs)) return tabs;
  const reorderedTabs = [];

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
