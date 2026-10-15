import { mount, unmount } from 'svelte';
import { course as minimal } from '../../../../packages/ui/src/custom/org-landing-page/minimal';
import { course as bold } from '../../../../packages/ui/src/custom/org-landing-page/bold';
import { course as classic } from '../../../../packages/ui/src/custom/org-landing-page/classic';
import { course as saas } from '../../../../packages/ui/src/custom/org-landing-page/saas';
import { course as tech } from '../../../../packages/ui/src/custom/org-landing-page/tech';
import { course as studio } from '../../../../packages/ui/src/custom/org-landing-page/studio';
import { course as corporate } from '../../../../packages/ui/src/custom/org-landing-page/corporate';
import { course as terminal } from '../../../../packages/ui/src/custom/org-landing-page/terminal';
import { course as editorial } from '../../../../packages/ui/src/custom/org-landing-page/editorial';
import { course as vibrant } from '../../../../packages/ui/src/custom/org-landing-page/vibrant';
import { course as quartz } from '../../../../packages/ui/src/custom/org-landing-page/quartz';
import {
  HeaderIcon,
  GoalIcon,
  LessonIcon,
  ExerciseIcon,
  CertificateIcon,
  MoneyIcon,
  ReviewIcon,
  PersonIcon,
  ContentIcon
} from '../../../../packages/ui/src/custom/moving-icons';
import Host from './course-host.svelte';

const COURSE_THEMES = { minimal, bold, classic, saas, tech, studio, corporate, terminal, editorial, vibrant, quartz };

const SECTION_ICONS: Record<string, unknown> = {
  hero: HeaderIcon,
  header: HeaderIcon,
  requirement: ExerciseIcon,
  description: LessonIcon,
  goals: GoalIcon,
  certificate: CertificateIcon,
  curriculum: ContentIcon,
  chips: ContentIcon,
  instructor: PersonIcon,
  reviews: ReviewIcon,
  pricing: MoneyIcon
};

interface EditOptions {
  onSelect: (key: string | null) => void;
  labelFor?: (key: string) => string;
}

/**
 * Mounts the real course landing page of a theme (`course` of packages/ui org-landing-page/<theme>).
 * With `edit`, every section is wrapped in the production EditableLandingSection (click to select, section cap).
 * Returns handles to push new props and to change the selected section without remounting.
 */
function renderCourse(
  target: HTMLElement,
  theme: keyof typeof COURSE_THEMES,
  props: Record<string, unknown>,
  edit?: EditOptions
) {
  const instance = mount(Host, {
    target,
    props: {
      Theme: COURSE_THEMES[theme] ?? COURSE_THEMES.quartz,
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

  return {
    update: (next: Record<string, unknown>) => instance.update(next),
    select: (key: string | null) => instance.select(key),
    destroy: () => unmount(instance as never)
  };
}

(window as unknown as { CioCourse: unknown }).CioCourse = { render: renderCourse, themes: Object.keys(COURSE_THEMES) };
