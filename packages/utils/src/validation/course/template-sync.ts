import { z } from 'zod';

import { isSelfEnrollmentAllowed } from '../../functions/course-enrollment';

export const SYNCABLE_SETTING_KEYS = [
  'description',
  'bannerImage',
  'welcomeEmail',
  'completionDeadline',
  'completionThreshold',
  'finalExercise',
  'lessonTabsOrder',
  'contentGrouping',
  'progression',
  'comments',
  'selfEnrollment',
  'markdownExport',
  'lessonDownload',
  'landingRequirements',
  'landingDescription',
  'landingGoals',
  'landingSkills',
  'landingTools',
  'landingInstructor',
  'pricing',
  'certificateDesign',
  'certificateRules',
  'aiTutor'
] as const;

export type SyncableSettingKey = (typeof SYNCABLE_SETTING_KEYS)[number];

export const ZPullTemplateUpdates = z.object({
  unitIds: z.array(z.string().uuid()).default([]),
  settingKeys: z.array(z.enum(SYNCABLE_SETTING_KEYS)).default([])
});

export type TemplateUnitKind = 'section' | 'lesson' | 'exercise';

export type SyncSection = {
  id: string;
  title: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  order: number;
  sourceId: string | null;
  sourceSyncedAt: string | null;
};

export type SyncLesson = {
  id: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  order: number;
  sectionId: string | null;
  sourceId: string | null;
  sourceSyncedAt: string | null;
  locales: { locale: string; updatedAt: string | null }[];
};

export type SyncExercise = {
  id: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  order: number;
  sectionId: string | null;
  lessonId: string | null;
  sourceId: string | null;
  sourceSyncedAt: string | null;
  childUpdatedAt: (string | null)[];
  submissionCount: number;
};

export type SettingMetadata = {
  welcomeEmailMessage?: string | null;
  lessonTabsOrder?: unknown;
  isContentGroupingEnabled?: boolean;
  progressionMode?: 'free' | 'sequential';
  commentsEnabled?: boolean;
  allowSelfEnrollment?: boolean | null;
  allowNewStudent?: boolean | null;
  allowMarkdownExport?: boolean;
  lessonDownload?: boolean;
  requirements?: string;
  description?: string;
  goals?: string;
  skills?: string[];
  tools?: string[];
  instructor?: unknown;
  showDiscount?: boolean;
  discount?: number;
  paymentEnabled?: boolean;
  paymentLink?: string;
  aiTutor?: unknown;
  reviews?: unknown;
};

export type SettingCertificate = {
  deadline?: string | null;
  threshold?: number;
  requiredExerciseId?: string | null;
  exerciseMinScorePercent?: number | null;
  theme?: string;
  design?: unknown;
  isDownloadable?: boolean;
  emailMessage?: string | null;
};

export type SettingCarrier = {
  description: string;
  bannerImage: string | null;
  cost: number | null;
  currency: string;
  updatedAt: string | null;
  metadata: SettingMetadata | null;
  certificate: SettingCertificate | null;
};

export type DetectedTemplateUnit = {
  id: string;
  kind: TemplateUnitKind;
  change: 'new' | 'updated';
  title: string;
  order: number;
  parentId: string | null;
  parentTitle: string | null;
  editedLocally: boolean;
  editedAt: string | null;
  removedLocally: boolean;
  locked: boolean;
  submissionCount: number;
  titleChanged: boolean;
  contentChanged: boolean;
  localesAdded: string[];
};

export type DetectedSettingChange = {
  key: SyncableSettingKey;
  templateValue: unknown;
  courseValue: unknown;
  /** Template unit that must be pulled with this setting, e.g. a final exercise the course has no copy of. */
  requiresUnitId?: string;
};

type CopyRef = {
  id: string;
  changedAt: string | null;
  sourceSyncedAt: string | null;
  order: number;
  title: string;
  locales: string[];
  submissionCount: number;
};

function time(value: string | null | undefined) {
  if (!value) return 0;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function later(left: string | null | undefined, right: string | null | undefined) {
  return time(left) > time(right);
}

function maxStamp(values: (string | null | undefined)[]) {
  return values.reduce<string | null>((latest, value) => {
    if (!value) return latest;
    if (!latest || later(value, latest)) return value;

    return latest;
  }, null);
}

function stable(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortValue((value as Record<string, unknown>)[key]);
  }

  return sorted;
}

function same(left: unknown, right: unknown) {
  return stable(left) === stable(right);
}

function parentOfExercise(exercise: SyncExercise) {
  if (exercise.lessonId) return { parentId: exercise.lessonId, parentKind: 'lesson' as const };
  if (exercise.sectionId) return { parentId: exercise.sectionId, parentKind: 'section' as const };

  return { parentId: null, parentKind: null };
}

function indexCopies(sections: SyncSection[], lessons: SyncLesson[], exercises: SyncExercise[]) {
  const copies = new Map<string, CopyRef>();

  for (const section of sections) {
    if (!section.sourceId) continue;

    copies.set(section.sourceId, {
      id: section.id,
      changedAt: section.updatedAt,
      sourceSyncedAt: section.sourceSyncedAt,
      order: section.order,
      title: section.title ?? '',
      locales: [],
      submissionCount: 0
    });
  }

  for (const lesson of lessons) {
    if (!lesson.sourceId) continue;

    copies.set(lesson.sourceId, {
      id: lesson.id,
      changedAt: maxStamp([lesson.updatedAt, ...lesson.locales.map((locale) => locale.updatedAt)]),
      sourceSyncedAt: lesson.sourceSyncedAt,
      order: lesson.order,
      title: lesson.title,
      locales: lesson.locales.map((locale) => locale.locale),
      submissionCount: 0
    });
  }

  for (const exercise of exercises) {
    if (!exercise.sourceId) continue;

    copies.set(exercise.sourceId, {
      id: exercise.id,
      changedAt: maxStamp([exercise.updatedAt, ...exercise.childUpdatedAt]),
      sourceSyncedAt: exercise.sourceSyncedAt,
      order: exercise.order,
      title: exercise.title,
      locales: [],
      submissionCount: exercise.submissionCount
    });
  }

  return copies;
}

function classifyUnit(
  template: {
    id: string;
    kind: TemplateUnitKind;
    title: string;
    order: number;
    createdAt: string | null;
    changedAt: string | null;
    parentId: string | null;
    locales: string[];
  },
  copy: CopyRef | undefined,
  courseCreatedAt: string | null,
  parentTitle: string | null
): DetectedTemplateUnit | null {
  const baseline = copy?.sourceSyncedAt ?? courseCreatedAt;
  const removedLocally = !copy && time(template.createdAt) > 0 && time(template.createdAt) <= time(courseCreatedAt);
  const isNew = !copy;
  const isUpdated = Boolean(copy && later(template.changedAt, baseline));
  if (!isNew && !isUpdated) return null;

  const localesAdded = copy ? template.locales.filter((locale) => !copy.locales.includes(locale)) : [];
  const titleChanged = Boolean(copy && template.title !== copy.title);
  const editedLocally = Boolean(copy && later(copy.changedAt, copy.sourceSyncedAt));

  return {
    id: template.id,
    kind: template.kind,
    change: isNew ? 'new' : 'updated',
    title: template.title,
    order: template.order,
    parentId: template.parentId,
    parentTitle,
    editedLocally,
    editedAt: editedLocally ? (copy?.changedAt ?? null) : null,
    removedLocally,
    locked: template.kind === 'exercise' && (copy?.submissionCount ?? 0) > 0,
    submissionCount: copy?.submissionCount ?? 0,
    titleChanged,
    contentChanged: !isNew && template.kind !== 'section',
    localesAdded
  };
}

export function detectTemplateContentChanges(input: {
  courseCreatedAt: string | null;
  templateSections: SyncSection[];
  templateLessons: SyncLesson[];
  templateExercises: SyncExercise[];
  courseSections: SyncSection[];
  courseLessons: SyncLesson[];
  courseExercises: SyncExercise[];
}): DetectedTemplateUnit[] {
  const copies = indexCopies(input.courseSections, input.courseLessons, input.courseExercises);
  const sectionTitle = new Map(input.templateSections.map((section) => [section.id, section.title ?? '']));
  const lessonTitle = new Map(input.templateLessons.map((lesson) => [lesson.id, lesson.title]));
  const units: DetectedTemplateUnit[] = [];

  for (const section of input.templateSections) {
    const detected = classifyUnit(
      {
        id: section.id,
        kind: 'section',
        title: section.title ?? '',
        order: section.order,
        createdAt: section.createdAt,
        changedAt: section.updatedAt,
        parentId: null,
        locales: []
      },
      copies.get(section.id),
      input.courseCreatedAt,
      null
    );
    if (detected) units.push(detected);
  }

  for (const lesson of input.templateLessons) {
    const detected = classifyUnit(
      {
        id: lesson.id,
        kind: 'lesson',
        title: lesson.title,
        order: lesson.order,
        createdAt: lesson.createdAt,
        changedAt: maxStamp([lesson.updatedAt, ...lesson.locales.map((locale) => locale.updatedAt)]),
        parentId: lesson.sectionId,
        locales: lesson.locales.map((locale) => locale.locale)
      },
      copies.get(lesson.id),
      input.courseCreatedAt,
      lesson.sectionId ? (sectionTitle.get(lesson.sectionId) ?? null) : null
    );
    if (detected) units.push(detected);
  }

  for (const exercise of input.templateExercises) {
    const parent = parentOfExercise(exercise);
    const parentTitle = parent.parentId
      ? parent.parentKind === 'section'
        ? (sectionTitle.get(parent.parentId) ?? null)
        : (lessonTitle.get(parent.parentId) ?? null)
      : null;
    const detected = classifyUnit(
      {
        id: exercise.id,
        kind: 'exercise',
        title: exercise.title,
        order: exercise.order,
        createdAt: exercise.createdAt,
        changedAt: maxStamp([exercise.updatedAt, ...exercise.childUpdatedAt]),
        parentId: parent.parentId,
        locales: []
      },
      copies.get(exercise.id),
      input.courseCreatedAt,
      parentTitle
    );
    if (detected) units.push(detected);
  }

  return units;
}

function metadata(course: SettingCarrier): SettingMetadata {
  return course.metadata ?? {};
}

function certificate(course: SettingCarrier): SettingCertificate {
  return course.certificate ?? {};
}

function uncopiedFinalExerciseId(template: SettingCarrier, exerciseCopyBySourceId: Map<string, string>) {
  const requiredId = certificate(template).requiredExerciseId ?? null;
  if (!requiredId || exerciseCopyBySourceId.has(requiredId)) return null;

  return requiredId;
}

function finalExerciseValue(course: SettingCarrier, exerciseIds: Map<string, string> | null) {
  const requiredId = certificate(course).requiredExerciseId ?? null;
  const mappedId = exerciseIds && requiredId ? (exerciseIds.get(requiredId) ?? requiredId) : requiredId;

  return {
    exerciseId: mappedId,
    minScore: certificate(course).exerciseMinScorePercent ?? null
  };
}

function pricingValue(course: SettingCarrier) {
  const fields = metadata(course);

  return {
    cost: course.cost,
    currency: course.currency,
    showDiscount: fields.showDiscount ?? false,
    discount: fields.discount ?? 0,
    paymentEnabled: fields.paymentEnabled ?? false,
    paymentLink: fields.paymentLink ?? ''
  };
}

export function readSettingValue(
  course: SettingCarrier,
  key: SyncableSettingKey,
  exerciseIds: Map<string, string> | null
): unknown {
  const fields = metadata(course);
  const rules = certificate(course);

  switch (key) {
    case 'description':
      return course.description;
    case 'bannerImage':
      return course.bannerImage;
    case 'welcomeEmail':
      return fields.welcomeEmailMessage ?? null;
    case 'completionDeadline':
      return rules.deadline ?? null;
    case 'completionThreshold':
      return rules.threshold ?? null;
    case 'finalExercise':
      return finalExerciseValue(course, exerciseIds);
    case 'lessonTabsOrder':
      return fields.lessonTabsOrder ?? null;
    case 'contentGrouping':
      return fields.isContentGroupingEnabled ?? false;
    case 'progression':
      return fields.progressionMode ?? 'free';
    case 'comments':
      return fields.commentsEnabled !== false;
    case 'selfEnrollment':
      return isSelfEnrollmentAllowed(fields);
    case 'markdownExport':
      return fields.allowMarkdownExport ?? false;
    case 'lessonDownload':
      return fields.lessonDownload ?? false;
    case 'landingRequirements':
      return fields.requirements ?? '';
    case 'landingDescription':
      return fields.description ?? '';
    case 'landingGoals':
      return fields.goals ?? '';
    case 'landingSkills':
      return fields.skills ?? [];
    case 'landingTools':
      return fields.tools ?? [];
    case 'landingInstructor':
      return fields.instructor ?? null;
    case 'pricing':
      return pricingValue(course);
    case 'certificateDesign':
      return { theme: rules.theme ?? null, design: rules.design ?? null };
    case 'certificateRules':
      return { isDownloadable: rules.isDownloadable ?? false, emailMessage: rules.emailMessage ?? null };
    case 'aiTutor':
      return fields.aiTutor ?? null;
    default:
      return null;
  }
}

export function detectSettingChanges(input: {
  template: SettingCarrier;
  course: SettingCarrier;
  courseCreatedAt: string | null;
  syncedAtByKey: Partial<Record<SyncableSettingKey, string>>;
  exerciseCopyBySourceId: Map<string, string>;
}): DetectedSettingChange[] {
  const changes: DetectedSettingChange[] = [];

  for (const key of SYNCABLE_SETTING_KEYS) {
    const syncedAt = input.syncedAtByKey[key] ?? input.courseCreatedAt;
    if (!later(input.template.updatedAt, syncedAt)) continue;

    const templateValue =
      key === 'finalExercise'
        ? readSettingValue(input.template, key, input.exerciseCopyBySourceId)
        : readSettingValue(input.template, key, null);
    const courseValue = readSettingValue(input.course, key, null);
    const requiresUnitId =
      key === 'finalExercise' ? uncopiedFinalExerciseId(input.template, input.exerciseCopyBySourceId) : null;
    if (!requiresUnitId && same(templateValue, courseValue)) continue;

    changes.push(
      requiresUnitId ? { key, templateValue, courseValue, requiresUnitId } : { key, templateValue, courseValue }
    );
  }

  return changes;
}

export function applySettingChanges(
  course: SettingCarrier,
  template: SettingCarrier,
  keys: SyncableSettingKey[],
  exerciseCopyBySourceId: Map<string, string>
): Partial<SettingCarrier> {
  const nextMetadata: SettingMetadata = { ...metadata(course) };
  const nextCertificate: SettingCertificate = { ...certificate(course) };
  const patch: Partial<SettingCarrier> = {};
  let metadataChanged = false;
  let certificateChanged = false;

  for (const key of keys) {
    const templateMetadata = metadata(template);
    const templateCertificate = certificate(template);

    switch (key) {
      case 'description':
        patch.description = template.description;
        break;
      case 'bannerImage':
        patch.bannerImage = template.bannerImage;
        break;
      case 'welcomeEmail':
        nextMetadata.welcomeEmailMessage = templateMetadata.welcomeEmailMessage ?? null;
        metadataChanged = true;
        break;
      case 'completionDeadline':
        nextCertificate.deadline = templateCertificate.deadline ?? null;
        certificateChanged = true;
        break;
      case 'completionThreshold':
        nextCertificate.threshold = templateCertificate.threshold;
        certificateChanged = true;
        break;
      case 'finalExercise': {
        const requiredId = templateCertificate.requiredExerciseId ?? null;
        const courseRequiredId = certificate(course).requiredExerciseId ?? null;
        nextCertificate.requiredExerciseId = requiredId
          ? (exerciseCopyBySourceId.get(requiredId) ?? courseRequiredId)
          : null;
        nextCertificate.exerciseMinScorePercent = templateCertificate.exerciseMinScorePercent ?? null;
        certificateChanged = true;
        break;
      }
      case 'lessonTabsOrder':
        nextMetadata.lessonTabsOrder = templateMetadata.lessonTabsOrder;
        metadataChanged = true;
        break;
      case 'contentGrouping':
        nextMetadata.isContentGroupingEnabled = templateMetadata.isContentGroupingEnabled ?? false;
        metadataChanged = true;
        break;
      case 'progression':
        nextMetadata.progressionMode = templateMetadata.progressionMode ?? 'free';
        metadataChanged = true;
        break;
      case 'comments':
        nextMetadata.commentsEnabled = templateMetadata.commentsEnabled !== false;
        metadataChanged = true;
        break;
      case 'selfEnrollment':
        nextMetadata.allowSelfEnrollment = isSelfEnrollmentAllowed(templateMetadata);
        metadataChanged = true;
        break;
      case 'markdownExport':
        nextMetadata.allowMarkdownExport = templateMetadata.allowMarkdownExport ?? false;
        metadataChanged = true;
        break;
      case 'lessonDownload':
        nextMetadata.lessonDownload = templateMetadata.lessonDownload ?? false;
        metadataChanged = true;
        break;
      case 'landingRequirements':
        nextMetadata.requirements = templateMetadata.requirements ?? '';
        metadataChanged = true;
        break;
      case 'landingDescription':
        nextMetadata.description = templateMetadata.description ?? '';
        metadataChanged = true;
        break;
      case 'landingGoals':
        nextMetadata.goals = templateMetadata.goals ?? '';
        metadataChanged = true;
        break;
      case 'landingSkills':
        nextMetadata.skills = templateMetadata.skills ?? [];
        metadataChanged = true;
        break;
      case 'landingTools':
        nextMetadata.tools = templateMetadata.tools ?? [];
        metadataChanged = true;
        break;
      case 'landingInstructor':
        nextMetadata.instructor = templateMetadata.instructor;
        metadataChanged = true;
        break;
      case 'pricing':
        patch.cost = template.cost;
        patch.currency = template.currency;
        nextMetadata.showDiscount = templateMetadata.showDiscount ?? false;
        nextMetadata.discount = templateMetadata.discount ?? 0;
        nextMetadata.paymentEnabled = templateMetadata.paymentEnabled ?? false;
        nextMetadata.paymentLink = templateMetadata.paymentLink ?? '';
        metadataChanged = true;
        break;
      case 'certificateDesign':
        nextCertificate.theme = templateCertificate.theme;
        nextCertificate.design = templateCertificate.design;
        certificateChanged = true;
        break;
      case 'certificateRules':
        nextCertificate.isDownloadable = templateCertificate.isDownloadable ?? false;
        nextCertificate.emailMessage = templateCertificate.emailMessage ?? null;
        certificateChanged = true;
        break;
      case 'aiTutor':
        nextMetadata.aiTutor = templateMetadata.aiTutor;
        metadataChanged = true;
        break;
      default:
        break;
    }
  }

  if (metadataChanged) patch.metadata = nextMetadata;
  if (certificateChanged) patch.certificate = nextCertificate;

  return patch;
}

export type PullSelectionResult =
  | { ok: true; unitIds: string[]; settingKeys: SyncableSettingKey[] }
  | { ok: false; reason: 'empty' | 'stale' | 'locked' };

export function preparePullSelection(
  units: DetectedTemplateUnit[],
  settings: DetectedSettingChange[],
  unitIds: string[],
  settingKeys: SyncableSettingKey[]
): PullSelectionResult {
  if (unitIds.length === 0 && settingKeys.length === 0) return { ok: false, reason: 'empty' };

  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const settingKeySet = new Set(settings.map((setting) => setting.key));
  if (unitIds.some((id) => !unitsById.has(id)) || settingKeys.some((key) => !settingKeySet.has(key))) {
    return { ok: false, reason: 'stale' };
  }

  const requiredUnitIds: string[] = [];
  for (const setting of settings) {
    if (!setting.requiresUnitId || !settingKeys.includes(setting.key)) continue;
    if (!unitsById.has(setting.requiresUnitId)) return { ok: false, reason: 'stale' };

    requiredUnitIds.push(setting.requiresUnitId);
  }

  const selected = new Set([...unitIds, ...requiredUnitIds]);
  const visit = (id: string) => {
    const unit = unitsById.get(id);
    if (!unit?.parentId) return;

    const parent = unitsById.get(unit.parentId);
    if (!parent || parent.change !== 'new' || selected.has(parent.id)) {
      if (parent?.change === 'new') visit(parent.id);
      return;
    }

    selected.add(parent.id);
    visit(parent.id);
  };

  for (const id of [...selected]) visit(id);

  if ([...selected].some((id) => unitsById.get(id)?.locked)) return { ok: false, reason: 'locked' };

  return { ok: true, unitIds: [...selected], settingKeys };
}

export function insertionOrder(
  templateSiblings: { id: string; order: number }[],
  templateId: string,
  copiesBySourceId: Map<string, { order: number }>,
  placedCopies: { order: number }[]
) {
  const sorted = templateSiblings.slice().sort((left, right) => left.order - right.order);
  const index = sorted.findIndex((sibling) => sibling.id === templateId);

  for (let siblingIndex = index - 1; siblingIndex >= 0; siblingIndex -= 1) {
    const copy = copiesBySourceId.get(sorted[siblingIndex].id);
    if (copy) return copy.order + 1;
  }

  if (placedCopies.length === 0) return 0;

  return Math.max(...placedCopies.map((copy) => copy.order)) + 1;
}
