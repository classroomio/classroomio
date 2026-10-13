export interface FormattedPermission {
  id: string;
  name: string;
  description: string;
  category: 'courses' | 'lessons' | 'progress' | 'certificates' | 'storage' | 'identity' | 'organization' | 'other';
  categoryLabel: string;
  isSensitive: boolean;
}

const PERMISSION_METADATA: Record<
  string,
  {
    name: string;
    description: string;
    category: FormattedPermission['category'];
    categoryLabel: string;
    isSensitive?: boolean;
  }
> = {
  // Courses
  'course.metadata:read': {
    name: 'View Course Outlines',
    description: 'Read course titles, descriptions, and syllabus structures',
    category: 'courses',
    categoryLabel: 'Courses'
  },
  'course:metadata:read': {
    name: 'View Course Outlines',
    description: 'Read course titles, descriptions, and syllabus structures',
    category: 'courses',
    categoryLabel: 'Courses'
  },
  'course:read': {
    name: 'View Course Outlines',
    description: 'Read course titles, descriptions, and syllabus structures',
    category: 'courses',
    categoryLabel: 'Courses'
  },
  'read:courses': {
    name: 'View Course Outlines',
    description: 'Read course titles, descriptions, and syllabus structures',
    category: 'courses',
    categoryLabel: 'Courses'
  },
  'course.content:read': {
    name: 'Read Course Content',
    description: 'Access section structures and lesson outlines',
    category: 'courses',
    categoryLabel: 'Courses',
    isSensitive: true
  },
  'course:content:read': {
    name: 'Read Course Content',
    description: 'Access section structures and lesson outlines',
    category: 'courses',
    categoryLabel: 'Courses',
    isSensitive: true
  },
  'course.metadata:write': {
    name: 'Manage Courses',
    description: 'Create, edit, or publish courses in your academy',
    category: 'courses',
    categoryLabel: 'Courses',
    isSensitive: true
  },
  'course:metadata:write': {
    name: 'Manage Courses',
    description: 'Create, edit, or publish courses in your academy',
    category: 'courses',
    categoryLabel: 'Courses',
    isSensitive: true
  },
  'course:write': {
    name: 'Manage Courses',
    description: 'Create, edit, or publish courses in your academy',
    category: 'courses',
    categoryLabel: 'Courses',
    isSensitive: true
  },
  'write:courses': {
    name: 'Manage Courses',
    description: 'Create, edit, or publish courses in your academy',
    category: 'courses',
    categoryLabel: 'Courses',
    isSensitive: true
  },
  'course.enrollment:read': {
    name: 'View Enrollments',
    description: 'See which learners are enrolled in courses',
    category: 'courses',
    categoryLabel: 'Courses'
  },
  'course:enrollment:read': {
    name: 'View Enrollments',
    description: 'See which learners are enrolled in courses',
    category: 'courses',
    categoryLabel: 'Courses'
  },

  // Lessons
  'lesson.metadata:read': {
    name: 'Read Lesson Info',
    description: 'View lesson titles, reading times, and word counts',
    category: 'lessons',
    categoryLabel: 'Lessons'
  },
  'lesson:metadata:read': {
    name: 'Read Lesson Info',
    description: 'View lesson titles, reading times, and word counts',
    category: 'lessons',
    categoryLabel: 'Lessons'
  },
  'lesson:read': {
    name: 'Read Lesson Info',
    description: 'View lesson titles, reading times, and word counts',
    category: 'lessons',
    categoryLabel: 'Lessons'
  },
  'read:lessons': {
    name: 'Read Lesson Info',
    description: 'View lesson titles, reading times, and word counts',
    category: 'lessons',
    categoryLabel: 'Lessons'
  },
  'lesson.content:read': {
    name: 'Access Lesson Content',
    description: 'Read lesson body markdown and attached course resources',
    category: 'lessons',
    categoryLabel: 'Lessons',
    isSensitive: true
  },
  'lesson:content:read': {
    name: 'Access Lesson Content',
    description: 'Read lesson body markdown and attached course resources',
    category: 'lessons',
    categoryLabel: 'Lessons',
    isSensitive: true
  },
  'read:lesson_content': {
    name: 'Access Lesson Content',
    description: 'Read lesson body markdown and attached course resources',
    category: 'lessons',
    categoryLabel: 'Lessons',
    isSensitive: true
  },
  'lesson:write': {
    name: 'Modify Lessons',
    description: 'Create, edit, and organize lessons',
    category: 'lessons',
    categoryLabel: 'Lessons',
    isSensitive: true
  },
  'lesson.write': {
    name: 'Modify Lessons',
    description: 'Create, edit, and organize lessons',
    category: 'lessons',
    categoryLabel: 'Lessons',
    isSensitive: true
  },
  'write:lessons': {
    name: 'Modify Lessons',
    description: 'Create, edit, and organize lessons',
    category: 'lessons',
    categoryLabel: 'Lessons',
    isSensitive: true
  },

  // Progress
  'learner.progress:read': {
    name: 'View Student Progress',
    description: 'Check lesson completion and reading statistics',
    category: 'progress',
    categoryLabel: 'Student Progress'
  },
  'learner:progress:read': {
    name: 'View Student Progress',
    description: 'Check lesson completion and reading statistics',
    category: 'progress',
    categoryLabel: 'Student Progress'
  },
  'progress:read': {
    name: 'View Student Progress',
    description: 'Check lesson completion and reading statistics',
    category: 'progress',
    categoryLabel: 'Student Progress'
  },
  'read:progress': {
    name: 'View Student Progress',
    description: 'Check lesson completion and reading statistics',
    category: 'progress',
    categoryLabel: 'Student Progress'
  },
  'learner.progress:write': {
    name: 'Update Student Progress',
    description: 'Mark lessons or course activities as complete',
    category: 'progress',
    categoryLabel: 'Student Progress',
    isSensitive: true
  },
  'learner:progress:write': {
    name: 'Update Student Progress',
    description: 'Mark lessons or course activities as complete',
    category: 'progress',
    categoryLabel: 'Student Progress',
    isSensitive: true
  },
  'progress:write': {
    name: 'Update Student Progress',
    description: 'Mark lessons or course activities as complete',
    category: 'progress',
    categoryLabel: 'Student Progress',
    isSensitive: true
  },
  'write:progress': {
    name: 'Update Student Progress',
    description: 'Mark lessons or course activities as complete',
    category: 'progress',
    categoryLabel: 'Student Progress',
    isSensitive: true
  },

  // Storage
  'plugin.storage:read': {
    name: 'Read Plugin Storage',
    description: "Access this plugin's isolated data in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'plugin:storage:read': {
    name: 'Read Plugin Storage',
    description: "Access this plugin's isolated data in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'storage:read': {
    name: 'Read Plugin Storage',
    description: "Access this plugin's isolated data in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'read:storage': {
    name: 'Read Plugin Storage',
    description: "Access this plugin's isolated data in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'plugin.storage:write': {
    name: 'Save Plugin Data',
    description: "Store this plugin's configuration and records in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'plugin:storage:write': {
    name: 'Save Plugin Data',
    description: "Store this plugin's configuration and records in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'storage:write': {
    name: 'Save Plugin Data',
    description: "Store this plugin's configuration and records in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },
  'write:storage': {
    name: 'Save Plugin Data',
    description: "Store this plugin's configuration and records in your academy database",
    category: 'storage',
    categoryLabel: 'Plugin Storage'
  },

  // Certificates
  'certificate.template:read': {
    name: 'Read Certificate Templates',
    description: 'View available certificate designs and layouts',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificate:template:read': {
    name: 'Read Certificate Templates',
    description: 'View available certificate designs and layouts',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificates:read': {
    name: 'Read Certificate Templates',
    description: 'View available certificate designs and layouts',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'read:certificates': {
    name: 'Read Certificate Templates',
    description: 'View available certificate designs and layouts',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificate.template:write': {
    name: 'Apply Certificate Designs',
    description: 'Configure and apply custom certificate templates to courses',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificate:template:write': {
    name: 'Apply Certificate Designs',
    description: 'Configure and apply custom certificate templates to courses',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificates:write': {
    name: 'Apply Certificate Designs',
    description: 'Configure and apply custom certificate templates to courses',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'write:certificates': {
    name: 'Apply Certificate Designs',
    description: 'Configure and apply custom certificate templates to courses',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificate.issued:read': {
    name: 'View Issued Certificates',
    description: 'Check credential IDs and recipient verification data',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },
  'certificate:issued:read': {
    name: 'View Issued Certificates',
    description: 'Check credential IDs and recipient verification data',
    category: 'certificates',
    categoryLabel: 'Certificates'
  },

  // Identity & Org
  'identity.profile:read': {
    name: 'View Basic User Profile',
    description: 'Access the current user display name, avatar, and role',
    category: 'identity',
    categoryLabel: 'User Identity'
  },
  'identity:profile:read': {
    name: 'View Basic User Profile',
    description: 'Access the current user display name, avatar, and role',
    category: 'identity',
    categoryLabel: 'User Identity'
  },
  'identity:read': {
    name: 'View Basic User Profile',
    description: 'Access the current user display name, avatar, and role',
    category: 'identity',
    categoryLabel: 'User Identity'
  },
  'read:identity': {
    name: 'View Basic User Profile',
    description: 'Access the current user display name, avatar, and role',
    category: 'identity',
    categoryLabel: 'User Identity'
  },
  'organization.profile:read': {
    name: 'Read Academy Details',
    description: 'Access the academy name, logo, and public slug',
    category: 'organization',
    categoryLabel: 'Academy'
  },
  'organization:profile:read': {
    name: 'Read Academy Details',
    description: 'Access the academy name, logo, and public slug',
    category: 'organization',
    categoryLabel: 'Academy'
  },
  'organization:read': {
    name: 'Read Academy Details',
    description: 'Access the academy name, logo, and public slug',
    category: 'organization',
    categoryLabel: 'Academy'
  },
  'read:organization': {
    name: 'Read Academy Details',
    description: 'Access the academy name, logo, and public slug',
    category: 'organization',
    categoryLabel: 'Academy'
  }
};

export function formatPluginPermission(scope: string): FormattedPermission {
  const normalized = scope.trim();
  const known = PERMISSION_METADATA[normalized];

  if (known) {
    return {
      id: normalized,
      name: known.name,
      description: known.description,
      category: known.category,
      categoryLabel: known.categoryLabel,
      isSensitive: Boolean(known.isSensitive)
    };
  }

  // Fallback for custom or unlisted scopes
  const parts = normalized.split(/[:.]/);
  const resource = parts[0] || 'Resource';
  const action = parts[parts.length - 1] || 'access';
  const capitalizedResource = resource.charAt(0).toUpperCase() + resource.slice(1);
  const isWrite = action === 'write';

  return {
    id: normalized,
    name: `${isWrite ? 'Manage' : 'View'} ${capitalizedResource}`,
    description: `Allows plugin to ${action} ${resource} data`,
    category: 'other',
    categoryLabel: 'Other Permissions',
    isSensitive: isWrite
  };
}

export function groupPluginPermissions(scopes: string[] = []): Array<{
  category: FormattedPermission['category'];
  categoryLabel: string;
  permissions: FormattedPermission[];
}> {
  if (!scopes || !Array.isArray(scopes)) {
    return [];
  }
  const formatted = scopes.map(formatPluginPermission);
  const categoryMap = new Map<
    FormattedPermission['category'],
    { categoryLabel: string; permissions: FormattedPermission[] }
  >();

  for (const perm of formatted) {
    const existing = categoryMap.get(perm.category);
    if (existing) {
      // Deduplicate by name
      if (!existing.permissions.some((p) => p.name === perm.name)) {
        existing.permissions.push(perm);
      }
    } else {
      categoryMap.set(perm.category, {
        categoryLabel: perm.categoryLabel,
        permissions: [perm]
      });
    }
  }

  const order: FormattedPermission['category'][] = [
    'courses',
    'lessons',
    'progress',
    'certificates',
    'storage',
    'identity',
    'organization',
    'other'
  ];

  return order
    .filter((category) => categoryMap.has(category))
    .map((category) => ({
      category,
      categoryLabel: categoryMap.get(category)!.categoryLabel,
      permissions: categoryMap.get(category)!.permissions
    }));
}

export function summarizePluginPermissions(scopes: string[]): Array<{ categoryLabel: string; isSensitive: boolean }> {
  const groups = groupPluginPermissions(scopes);
  return groups.map((g) => ({
    categoryLabel: g.categoryLabel,
    isSensitive: g.permissions.some((p) => p.isSensitive)
  }));
}
