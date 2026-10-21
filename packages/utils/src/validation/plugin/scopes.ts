import * as z from 'zod';

export const PLUGIN_CAPABILITY_IDS = [
  'identity.profile:read',
  'organization.profile:read',
  'organization.members:read',
  'course.metadata:read',
  'course.content:read',
  'course.metadata:write',
  'course.enrollment:read',
  'course.enrollment:write',
  'lesson.metadata:read',
  'lesson.content:read',
  'lesson:write',
  'learner.profile:read',
  'learner.progress:read',
  'learner.progress:write',
  'exercise.metadata:read',
  'submission:read',
  'submission:write',
  'grade:read',
  'grade:write',
  'certificate.issued:read',
  'certificate.issuance:write',
  'certificate.revocation:write',
  'certificate.template:read',
  'certificate.template:write',
  'cohort.metadata:read',
  'cohort.membership:read',
  'analytics.summary:read',
  'notification:write',
  'plugin.storage:read',
  'plugin.storage:write'
] as const;

export type PluginCapabilityId = (typeof PLUGIN_CAPABILITY_IDS)[number];
export type PluginCapabilityStatus = 'planned' | 'experimental' | 'active' | 'deprecated';
export type PluginCapabilityTransport = 'backend' | 'ui';
export type PluginCapabilitySensitivity = 'standard' | 'sensitive' | 'highly-sensitive';
export type PluginInstallationOwner = 'organization' | 'user';

export interface PluginCapabilityDefinition {
  scope: PluginCapabilityId;
  status: PluginCapabilityStatus;
  apiVersion: 'v1';
  sensitivity: PluginCapabilitySensitivity;
  allowedInstallationOwners: readonly PluginInstallationOwner[];
  allowedTransports: readonly PluginCapabilityTransport[];
  fieldsDisclosed: readonly string[];
  consentDescription: string;
  documentationUrl: string;
}

type PluginCapabilityDefinitionInput = Omit<
  PluginCapabilityDefinition,
  'scope' | 'apiVersion' | 'allowedInstallationOwners'
>;

function planned(
  consentDescription: string,
  sensitivity: boolean | PluginCapabilitySensitivity
): PluginCapabilityDefinitionInput {
  return {
    status: 'planned',
    sensitivity: typeof sensitivity === 'boolean' ? (sensitivity ? 'sensitive' : 'standard') : sensitivity,
    allowedTransports: ['backend'],
    fieldsDisclosed: [],
    consentDescription,
    documentationUrl: 'prd/plugin-system/public-plugin-api-v1.md'
  };
}

function active(
  consent: string,
  sensitive: boolean,
  disclosedFields: readonly string[],
  transports: readonly PluginCapabilityTransport[] = ['backend']
): PluginCapabilityDefinitionInput {
  return {
    status: 'active',
    sensitivity: sensitive ? 'sensitive' : 'standard',
    allowedTransports: transports,
    fieldsDisclosed: disclosedFields,
    consentDescription: consent,
    documentationUrl: 'prd/plugin-system/public-plugin-api-v1.md'
  };
}

const PLUGIN_CAPABILITY_DEFINITIONS: Record<PluginCapabilityId, PluginCapabilityDefinitionInput> = {
  'identity.profile:read': active(
    'Read the current user profile',
    false,
    ['id', 'displayName', 'avatarUrl', 'locale', 'role'],
    ['backend']
  ),
  'organization.profile:read': active(
    'Read the organization profile',
    false,
    ['id', 'name', 'avatarUrl', 'locale'],
    ['backend']
  ),
  'organization.members:read': planned('Read organization members', true),
  'course.metadata:read': active(
    'Read course metadata',
    false,
    [
      'id',
      'title',
      'slug',
      'description',
      'imageUrl',
      'status',
      'visibility',
      'published',
      'publishedAt',
      'createdAt',
      'updatedAt'
    ],
    ['backend']
  ),
  'course.content:read': active(
    'Read course content structure',
    true,
    [
      'courseId',
      'sections',
      'sections.id',
      'sections.title',
      'sections.order',
      'sections.lessons',
      'sections.lessons.id',
      'sections.lessons.title',
      'sections.lessons.order',
      'sections.lessons.type'
    ],
    ['backend']
  ),
  'course.metadata:write': planned('Create and update courses', true),
  'course.enrollment:read': active(
    'Read course enrollments',
    true,
    ['id', 'courseId', 'profileId', 'role', 'status', 'enrolledAt', 'completedAt'],
    ['backend']
  ),
  'course.enrollment:write': planned('Manage course enrollments', true),
  'lesson.metadata:read': active(
    'Read lesson metadata',
    false,
    [
      'id',
      'courseId',
      'title',
      'type',
      'order',
      'published',
      'wordCount',
      'estimatedMinutes',
      'createdAt',
      'updatedAt'
    ],
    ['backend']
  ),
  'lesson.content:read': active(
    'Read sanitized lesson content and attachments',
    true,
    [
      'id',
      'courseId',
      'title',
      'type',
      'order',
      'content',
      'attachments',
      'wordCount',
      'estimatedMinutes',
      'updatedAt'
    ],
    ['backend']
  ),
  'lesson:write': planned('Create and update lessons', true),
  'learner.profile:read': planned('Read learner profiles', true),
  'learner.progress:read': active(
    'Read learner progress in the current lesson or course',
    true,
    ['isComplete', 'courseId', 'percentage', 'lessonsCompleted', 'totalLessons', 'certificateEarnedAt'],
    ['backend']
  ),
  'learner.progress:write': active('Update learner progress in the current lesson', true, ['isComplete'], ['backend']),
  'exercise.metadata:read': active(
    'Read exercise metadata',
    false,
    [
      'id',
      'courseId',
      'lessonId',
      'title',
      'description',
      'order',
      'allowMultipleAttempts',
      'completionPolicy',
      'passThreshold',
      'questionCount',
      'totalPoints',
      'createdAt',
      'updatedAt'
    ],
    ['backend']
  ),
  'submission:read': planned('Read learner submissions', true),
  'submission:write': planned('Create and update submissions', true),
  'grade:read': planned('Read grades', true),
  'grade:write': planned('Create and release grades', true),
  'certificate.issued:read': active(
    'Read issued certificates',
    true,
    ['id', 'courseId', 'profileId', 'cycleNumber', 'issuedAt', 'expiresAt', 'status', 'verificationUrl'],
    ['backend']
  ),
  'certificate.issuance:write': planned('Issue certificates', true),
  'certificate.revocation:write': planned('Revoke certificates', 'highly-sensitive'),
  'certificate.template:read': active(
    'Read certificate templates',
    false,
    ['id', 'name', 'style', 'description', 'accentColor', 'subtitle', 'version', 'design'],
    ['backend']
  ),
  'certificate.template:write': active(
    'Apply certificate templates to the current course',
    true,
    ['id', 'name', 'design', 'version', 'appliedAt'],
    ['backend']
  ),
  'cohort.metadata:read': planned('Read cohort metadata', false),
  'cohort.membership:read': planned('Read cohort membership', true),
  'analytics.summary:read': planned('Read aggregate analytics', true),
  'notification:write': planned('Send ClassroomIO notifications', true),
  'plugin.storage:read': active(
    "Read this plugin's isolated storage",
    false,
    ['namespace', 'key', 'value', 'scope', 'version'],
    ['backend', 'ui']
  ),
  'plugin.storage:write': active(
    "Write to this plugin's isolated storage",
    false,
    ['namespace', 'key', 'value', 'scope', 'version'],
    ['backend', 'ui']
  )
};

export const PLUGIN_CAPABILITIES = Object.fromEntries(
  PLUGIN_CAPABILITY_IDS.map((scope) => [
    scope,
    {
      scope,
      apiVersion: 'v1' as const,
      allowedInstallationOwners: ['organization'] as const,
      ...PLUGIN_CAPABILITY_DEFINITIONS[scope]
    }
  ])
) as unknown as Record<PluginCapabilityId, PluginCapabilityDefinition>;

export const PLUGIN_PERMISSION_SCOPES = PLUGIN_CAPABILITY_IDS.filter(
  (scope) => PLUGIN_CAPABILITIES[scope].status === 'active'
);

export type PluginPermissionScope = (typeof PLUGIN_PERMISSION_SCOPES)[number];

export const SENSITIVE_PLUGIN_SCOPES = PLUGIN_PERMISSION_SCOPES.filter(
  (scope) => PLUGIN_CAPABILITIES[scope].sensitivity !== 'standard'
);

export const ZPluginPermissionScope = z.custom<PluginPermissionScope>(
  (value) => typeof value === 'string' && (PLUGIN_PERMISSION_SCOPES as readonly string[]).includes(value),
  'Permission scope is not active in this Plugin API version'
);

export function isSensitiveScope(scope: string): boolean {
  return scope in PLUGIN_CAPABILITIES && PLUGIN_CAPABILITIES[scope as PluginCapabilityId].sensitivity !== 'standard';
}

export function getPluginCapability(scope: string): PluginCapabilityDefinition | null {
  return scope in PLUGIN_CAPABILITIES ? PLUGIN_CAPABILITIES[scope as PluginCapabilityId] : null;
}
