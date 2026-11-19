import type { TabsBlockLabels } from '@cio/ui/custom/block';
import { t } from '$lib/utils/functions/translations';
import type { TabExampleCopy } from './tabs-utils';

const KEY = 'course.navItem.lessons.materials.blocks.tabs';

export function getTabsLabels(): TabsBlockLabels {
  return {
    tabList: t.get(`${KEY}.tab_list`),
    position: t.get(`${KEY}.position`),
    alignments: {
      left: t.get(`${KEY}.align_left`),
      center: t.get(`${KEY}.align_center`),
      right: t.get(`${KEY}.align_right`)
    },
    tabName: t.get(`${KEY}.tab_name`),
    untitledTab: t.get(`${KEY}.untitled_tab`),
    notePlaceholder: t.get(`${KEY}.note_placeholder`),
    addTab: t.get(`${KEY}.add_tab`),
    removeTab: t.get(`${KEY}.remove_tab`)
  };
}

export interface TabMediaLabels {
  addImage: string;
  addVideo: string;
  removeImage: string;
  removeVideo: string;
}

export function getTabMediaLabels(): TabMediaLabels {
  return {
    addImage: t.get(`${KEY}.add_image`),
    addVideo: t.get(`${KEY}.add_video`),
    removeImage: t.get(`${KEY}.remove_image`),
    removeVideo: t.get(`${KEY}.remove_video`)
  };
}

export function getNewTabName(): string {
  return t.get(`${KEY}.new_tab`);
}

export function getTabsExampleCopy(): TabExampleCopy[] {
  return [1, 2, 3].map((number) => ({
    name: t.get(`${KEY}.example.name_${number}`),
    note: t.get(`${KEY}.example.note_${number}`)
  }));
}
