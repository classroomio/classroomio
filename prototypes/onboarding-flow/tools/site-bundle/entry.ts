import { mount, unmount } from 'svelte';
import {
  ContentIcon,
  CourseIcon,
  ExploreIcon,
  ExternalLinkIcon,
  GoalIcon,
  HeaderIcon,
  SettingsIcon
} from '../../../../packages/ui/src/custom/moving-icons';
import Host from './course-host.svelte';
import { LANDING_THEME_VARS } from '../../../../packages/ui/src/custom/org-landing-page/theme-style';
import { org as minimal } from '../../../../packages/ui/src/custom/org-landing-page/minimal';
import { org as bold } from '../../../../packages/ui/src/custom/org-landing-page/bold';
import { org as classic } from '../../../../packages/ui/src/custom/org-landing-page/classic';
import { org as saas } from '../../../../packages/ui/src/custom/org-landing-page/saas';
import { org as tech } from '../../../../packages/ui/src/custom/org-landing-page/tech';
import { org as studio } from '../../../../packages/ui/src/custom/org-landing-page/studio';
import { org as corporate } from '../../../../packages/ui/src/custom/org-landing-page/corporate';
import { org as terminal } from '../../../../packages/ui/src/custom/org-landing-page/terminal';
import { org as editorial } from '../../../../packages/ui/src/custom/org-landing-page/editorial';
import { org as vibrant } from '../../../../packages/ui/src/custom/org-landing-page/vibrant';
import { org as quartz } from '../../../../packages/ui/src/custom/org-landing-page/quartz';

const THEMES = { minimal, bold, classic, saas, tech, studio, corporate, terminal, editorial, vibrant, quartz };

const SECTION_ICONS: Record<string, unknown> = {
  navigation: ContentIcon,
  hero: HeaderIcon,
  courses: CourseIcon,
  links: ExploreIcon,
  embed: ExternalLinkIcon,
  callout: GoalIcon,
  footer: SettingsIcon
};

interface EditOptions {
  onSelect: (key: string | null) => void;
  labelFor?: (key: string) => string;
}

let mounted: ReturnType<typeof mount> | null = null;

/**
 * Mounts the real org landing page of a theme. With `edit`, every section is wrapped in the production
 * EditableLandingSection (click to select, section cap). Returns handles to push props and change selection.
 */
function render(
  target: HTMLElement,
  theme: keyof typeof THEMES,
  props: Record<string, unknown>,
  edit?: EditOptions
) {
  if (mounted) unmount(mounted);
  const instance = mount(Host, {
    target,
    props: {
      Theme: THEMES[theme] ?? THEMES.quartz,
      initial: props,
      edit: edit
        ? {
            onSelect: edit.onSelect,
            labelFor: edit.labelFor ?? ((key: string) => key),
            iconFor: (key: string) => SECTION_ICONS[key]
          }
        : null
    }
  }) as unknown as { update: (next: Record<string, unknown>) => void; select: (key: string | null) => void };

  mounted = instance as never;

  return { update: (next: Record<string, unknown>) => instance.update(next), select: (key: string | null) => instance.select(key) };
}

(window as unknown as { CioSite: unknown }).CioSite = { render, themes: Object.keys(THEMES), vars: LANDING_THEME_VARS };

import './course-entry';
