export const PLUGIN_CATEGORIES = ['activity', 'block', 'integration', 'certificate', 'landing', 'enrollment'] as const;

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number];

export const SLOT_NAMES = [
  'lesson.activity',
  'lesson.sidebar',
  'course.sidebar',
  'course.format',
  'lesson.after',
  'landing.sections',
  'landing.hero.after',
  'landing.footer.before',
  'certificate.template',
  'certificate.actions',
  'enrollment.flow'
] as const;

export type SlotName = (typeof SLOT_NAMES)[number];

export interface ThemeConfig {
  primary?: string;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full' | string;
  font?: string;
}

export type ComponentType = abstract new (...args: any[]) => any;

export interface PluginComponentModule {
  default: ComponentType;
}

/** A browser-only loader such as `() => import('./widget.svelte')`. */
export type PluginComponentLoader = () => Promise<PluginComponentModule>;

export interface LayoutDefinition {
  key: string;
  shell: string | ComponentType;
}

export interface NavItemConfig {
  key: string;
  title: string;
  path: string;
  group?: string | null;
  icon?: any;
  [key: string]: any;
}

export interface NavGroup {
  labelKey: string | null;
  items: NavItemConfig[];
}

export interface NavConfig {
  remove?: string[];
  rename?: Record<string, string>;
  add?: NavItemConfig[];
}

export interface TerminologyConfig {
  course?: string;
  student?: string;
  [key: string]: string | undefined;
}

/** A validated, data-only certificate template consumed by the host renderer. */
export interface CertificateTemplateDefinition {
  id: string;
  label: string;
  description: string;
  body: string;
  styles: string;
}

export type PluginActivation =
  | { kind: 'always' }
  | {
      kind: 'org-capability';
      capabilityId: string;
      nameKey: string;
      descriptionKey: string;
    };

/**
 * Navigation entry a plugin contributes to the org sidebar.
 * `path` is the subpath under `/org/[slug]/plugins/`, e.g. `'certificate-studio'`.
 * `icon` is a Lucide icon name string, e.g. `'award'`.
 * `group` controls which sidebar section the item appears in.
 */
export interface DynamicPluginNavDefinition {
  titleKey: string;
  path: string;
  icon: string;
  manageLabelKey?: string;
  group?: 'main' | 'tools' | 'bottom';
  adminOnly?: boolean;
}

/**
 * A resolved nav item derived from a plugin — ready for direct sidebar rendering.
 */
export interface ResolvedPluginNavItem {
  pluginId: string;
  titleKey: string;
  href: string;
  icon: string;
  group: 'main' | 'tools' | 'bottom';
  adminOnly: boolean;
}

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  description: string;
  activation?: PluginActivation;
  /** Sidebar navigation entry this plugin contributes. */
  pluginNav?: DynamicPluginNavDefinition;
  /** Static nav config additions/removals/renames. */
  nav?: NavConfig;
  /** Lazy route map: keys are subpaths (e.g. '/', '/editor'), values are dynamic import loaders. */
  routes?: Record<string, PluginComponentLoader>;
  slots?: Partial<Record<SlotName, PluginComponentLoader | PluginComponentLoader[]>>;
  certificateTemplates?: CertificateTemplateDefinition[];
}

export interface ClassroomIOConfig {
  theme?: ThemeConfig;
  layout?: LayoutDefinition;
  nav?: NavConfig;
  terminology?: TerminologyConfig;
  plugins?: PluginDefinition[];
}

export interface ResolvedConfig {
  theme: {
    primary: string;
    radius: string;
    font: string;
    [key: string]: any;
  };
  layout: LayoutDefinition;
  nav: {
    remove: string[];
    rename: Record<string, string>;
    add: NavItemConfig[];
  };
  terminology: TerminologyConfig;
  plugins: PluginDefinition[];
  slots: Partial<Record<SlotName, PluginComponentLoader[]>>;
  certificateTemplates: Record<string, CertificateTemplateDefinition>;
}
