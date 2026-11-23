type Scope = string | null;

export const staffKeys = {
  all: (userId: Scope, orgId: Scope) => ['staff', userId, orgId] as const,
  stats: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'stats'] as const,
  sessions: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'sessions'] as const,
  activity: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'activity'] as const,
  upcomingSubmissions: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'submissions', 'upcoming'] as const,
  submissionHistory: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'submissions', 'history'] as const,
  learners: (userId: Scope, orgId: Scope, filter: string, search: string) =>
    ['staff', userId, orgId, 'learners', filter, search] as const,
  learnersAll: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'learners'] as const,
  health: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'health'] as const,
  people: (userId: Scope, orgId: Scope, role: string, search: string) =>
    ['staff', userId, orgId, 'people', role, search] as const,
  capacity: (userId: Scope, orgId: Scope) => ['staff', userId, orgId, 'capacity'] as const,
  members: (userId: Scope, orgId: Scope, courseId: string, search: string) =>
    ['staff', userId, orgId, 'course', courseId, 'members', search] as const,
  membersAll: (userId: Scope, orgId: Scope, courseId: string) =>
    ['staff', userId, orgId, 'course', courseId, 'members'] as const,
  inviteLink: (userId: Scope, orgId: Scope, courseId: string) =>
    ['staff', userId, orgId, 'course', courseId, 'invite-link'] as const
};
