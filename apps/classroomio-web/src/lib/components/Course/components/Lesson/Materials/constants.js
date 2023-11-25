import { Video, Notebook, PresentationFile } from 'carbon-icons-svelte';

export let tabs = [
  {
    label: 'Note',
    icon: Notebook,
    value: 1,
    badgeValue: 0
  },
  {
    label: 'Slide',
    icon: PresentationFile,
    value: 2,
    badgeValue: 0
  },
  {
    label: 'Video',
    icon: Video,
    value: 3,
    badgeValue: 0
  }
];

export function orderedTabs(tabs, Settingtabs) {
  if (!Array.isArray(Settingtabs)) return tabs;
  const reorderedTabs = [];

  const tabMap = new Map(tabs.map((tab) => [tab.label, tab]));

  Settingtabs.forEach((settingTab, index) => {
    const tab = tabMap.get(settingTab.name);
    if (tab) {
      reorderedTabs[index] = tab;
    }
  });

  const filteredReorderedTabs = reorderedTabs.filter((tab) => tab !== undefined);
  return filteredReorderedTabs;
}
