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

export const HOOK_NAMES = [
  'lesson.completed',
  'exercise.graded',
  'student.enrolled',
  'course.published',
  'certificate.issued'
] as const;

export type HookName = (typeof HOOK_NAMES)[number];

export const PERMISSION_SCOPES = [
  'exercise:read',
  'submission:write',
  'enrollment:read',
  'completion:write',
  'grade:write',
  'data:own',
  'public:read'
] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

export interface PrivacyManifest {
  description: string;
  storesPersonalData: boolean;
  onDeleteUser: (userId: string, orgId: string) => Promise<void>;
  onExportUser: (userId: string, orgId: string) => Promise<Record<string, unknown>>;
}

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

export interface EventContext {
  timestamp: Date;
  [key: string]: any;
}

export type EventHandler<T = any> = (payload: T, ctx: EventContext) => void | Promise<void>;

export type EntityFieldType = 'text' | 'int' | 'float' | 'boolean' | 'timestamp' | 'json';

export interface EntityFieldDefinition {
  type: EntityFieldType;
  default?: any;
  required?: boolean;
}

export type EntityScope = 'org' | 'course' | 'lesson' | 'user';

export interface EntitySchema<
  TFields extends Record<string, EntityFieldDefinition> = Record<string, EntityFieldDefinition>
> {
  scope: EntityScope[];
  fields: TFields;
}

export interface EntityDefinition<
  TFields extends Record<string, EntityFieldDefinition> = Record<string, EntityFieldDefinition>
> {
  name: string;
  schema: EntitySchema<TFields>;
}

export interface EntityRecord<TData = Record<string, any>> {
  id: string;
  pluginName: string;
  entityName: string;
  orgId: string;
  courseId?: string | null;
  lessonId?: string | null;
  userId?: string | null;
  data: TData;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface NewEntityRecord<TData = Record<string, any>> {
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  data: TData;
}

export interface EntityRecordFilter {
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
}

export interface EntityQuery extends EntityRecordFilter {
  orgId: string;
  pluginName: string;
  entityName: string;
}

export interface EntityUpsertQuery<TData = Record<string, any>> {
  where: EntityQuery;
  create: NewEntityRecord<TData> & { pluginName: string; entityName: string; orgId: string };
  update: { data: Partial<TData> };
}

export interface EntityStorageAdapter {
  findOne(query: EntityQuery): Promise<EntityRecord | null>;
  findMany(query: EntityQuery): Promise<EntityRecord[]>;
  insert(record: NewEntityRecord & { pluginName: string; entityName: string; orgId: string }): Promise<EntityRecord>;
  update(query: EntityQuery, data: { data: Record<string, any> }): Promise<EntityRecord | null>;
  delete(query: EntityQuery): Promise<boolean>;
  upsert(query: EntityUpsertQuery): Promise<EntityRecord>;
}

export interface EntityRepository<TData extends Record<string, any> = Record<string, any>> {
  findOne(filter?: EntityRecordFilter): Promise<EntityRecord<TData> | null>;
  findMany(filter?: EntityRecordFilter): Promise<EntityRecord<TData>[]>;
  insert(record: NewEntityRecord<TData>): Promise<EntityRecord<TData>>;
  update(where: EntityRecordFilter, data: { data: Partial<TData> }): Promise<EntityRecord<TData> | null>;
  delete(where: EntityRecordFilter): Promise<boolean>;
  upsert(query: {
    where: EntityRecordFilter;
    create: NewEntityRecord<TData>;
    update: { data: Partial<TData> };
  }): Promise<EntityRecord<TData>>;
}

export interface ActivityRenderers {
  edit: PluginComponentLoader;
  take: PluginComponentLoader;
  review: PluginComponentLoader;
}

export interface ActivityTypeDefinition {
  key: string;
  label: string;
  renderers: ActivityRenderers;
  isCompleted?: (state: any) => boolean;
  calculateGrade?: (state: any) => number;
}

/** A validated, data-only certificate template consumed by the host renderer. */
export interface CertificateTemplateDefinition {
  id: string;
  label: string;
  description: string;
  body: string;
  styles: string;
}

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  description: string;
  permissions?: PermissionScope[];
  nav?: { add?: NavItemConfig[] };
  routes?: Record<string, any>;
  slots?: Partial<Record<SlotName, PluginComponentLoader | PluginComponentLoader[]>>;
  on?: Partial<Record<HookName, EventHandler>>;
  entities?: EntityDefinition[];
  activities?: ActivityTypeDefinition[];
  certificateTemplates?: CertificateTemplateDefinition[];
  privacy?: PrivacyManifest;
}

export interface ClassroomIOConfig {
  theme?: ThemeConfig;
  layout?: LayoutDefinition;
  nav?: NavConfig;
  terminology?: TerminologyConfig;
  plugins?: PluginDefinition[];
  entities?: EntityDefinition[];
  activities?: ActivityTypeDefinition[];
  [key: string]: any;
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
  routes: Record<string, any>;
  slots: Partial<Record<SlotName, PluginComponentLoader[]>>;
  entities: Record<string, EntityDefinition>;
  activities: Record<string, ActivityTypeDefinition>;
  certificateTemplates: Record<string, CertificateTemplateDefinition>;
}
