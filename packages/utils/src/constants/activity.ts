export const ACTIVITY_KINDS = ['scorm'] as const;

export type TActivityKind = (typeof ACTIVITY_KINDS)[number];

export const CONTENT_PACKAGE_STATUSES = ['uploading', 'processing', 'ready', 'failed', 'archived'] as const;

export type TContentPackageStatus = (typeof CONTENT_PACKAGE_STATUSES)[number];

export const CONTENT_PACKAGE_FORMATS = ['scorm12', 'scorm2004_2', 'scorm2004_3', 'scorm2004_4'] as const;

export type TContentPackageFormat = (typeof CONTENT_PACKAGE_FORMATS)[number];

export const CONTENT_PACKAGE_UNIT_TYPES = ['sco', 'asset'] as const;

export type TContentPackageUnitType = (typeof CONTENT_PACKAGE_UNIT_TYPES)[number];

export const SCORM_COMPLETION_RULES = ['auto', 'completed', 'passed', 'score'] as const;

export type TScormCompletionRule = (typeof SCORM_COMPLETION_RULES)[number];

export const SCORM_LAUNCH_MODES = ['embedded', 'window'] as const;

export type TScormLaunchMode = (typeof SCORM_LAUNCH_MODES)[number];

export const SCORM_ATTEMPT_CLOSE_REASONS = ['finished', 'replaced'] as const;

export type TScormAttemptCloseReason = (typeof SCORM_ATTEMPT_CLOSE_REASONS)[number];

export const SCORM_SCO_ATTEMPT_STATUSES = ['active', 'suspended', 'closed'] as const;

export type TScormScoAttemptStatus = (typeof SCORM_SCO_ATTEMPT_STATUSES)[number];

export const SCORM_SESSION_EVENT_KINDS = [
  'launch',
  'initialize',
  'commit',
  'terminate',
  'beacon',
  'error',
  'not_initialized'
] as const;

export type TScormSessionEventKind = (typeof SCORM_SESSION_EVENT_KINDS)[number];
