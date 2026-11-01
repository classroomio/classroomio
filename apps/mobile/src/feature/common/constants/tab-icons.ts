import type { ImageSourcePropType } from 'react-native';

type TabIcon = { default: ImageSourcePropType; selected: ImageSourcePropType };

/** Phosphor regular glyphs, filled when selected, rendered as template images so the tab bar tints them. */
export const TAB_ICONS = {
  home: {
    default: require('../../../../assets/tab-icons/home.png'),
    selected: require('../../../../assets/tab-icons/home-selected.png')
  },
  learn: {
    default: require('../../../../assets/tab-icons/learn.png'),
    selected: require('../../../../assets/tab-icons/learn-selected.png')
  },
  compliance: {
    default: require('../../../../assets/tab-icons/compliance.png'),
    selected: require('../../../../assets/tab-icons/compliance-selected.png')
  },
  teach: {
    default: require('../../../../assets/tab-icons/teach.png'),
    selected: require('../../../../assets/tab-icons/teach-selected.png')
  },
  community: {
    default: require('../../../../assets/tab-icons/community.png'),
    selected: require('../../../../assets/tab-icons/community-selected.png')
  },
  profile: {
    default: require('../../../../assets/tab-icons/profile.png'),
    selected: require('../../../../assets/tab-icons/profile-selected.png')
  }
} satisfies Record<string, TabIcon>;
