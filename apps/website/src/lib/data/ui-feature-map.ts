export type UiFeatureArea = {
  area: string;
  description: string;
  articles: string[];
};

export const UI_FEATURE_AREAS: UiFeatureArea[] = [
  {
    area: 'Organization dashboard and analytics',
    description: 'The admin home, organization analytics, top courses, countries, and landing-page performance.',
    articles: [
      'organization-and-team/admin-dashboard',
      'analytics-and-reporting/understand-the-organization-dashboard',
      'analytics-and-reporting/read-your-organization-analytics-overview',
      'analytics-and-reporting/compare-your-top-courses',
      'analytics-and-reporting/view-top-countries-and-popular-course-types',
      'analytics-and-reporting/analyze-landing-views-enrollments-and-completions'
    ]
  },
  {
    area: 'Courses and course templates',
    description: 'Create courses from scratch, with AI, from a template, or by import; save and update templates.',
    articles: [
      'build-courses/create-a-course-from-scratch',
      'build-courses/create-a-course-with-ai',
      'build-courses/use-the-ai-assistant-in-the-course-editor',
      'build-courses/create-a-course-from-a-template',
      'build-courses/save-a-course-as-a-template',
      'build-courses/update-a-course-from-its-template',
      'build-courses/duplicate-or-import-a-course',
      'reference/course-templates'
    ]
  },
  {
    area: 'Course editor: lessons, exercises and media',
    description: 'Lessons, the editor, video, exercises, question types, grading rules, and version history.',
    articles: [
      'build-courses/create-and-edit-a-lesson',
      'build-courses/write-lesson-content-in-the-editor',
      'build-courses/add-or-upload-a-video',
      'build-courses/upload-files-to-your-media-library',
      'build-courses/recover-drafts-and-use-version-history',
      'create-and-deliver/create-exercise',
      'build-courses/choose-an-exercise-question-type',
      'build-courses/set-answers-points-and-automatic-grading',
      'create-and-deliver/use-math-in-editor'
    ]
  },
  {
    area: 'Course settings, people and news feed',
    description: 'Course details, comments and downloads, who is enrolled, learner progress, and announcements.',
    articles: [
      'build-courses/update-course-details-and-cover-image',
      'build-courses/enable-comments-and-course-downloads',
      'build-courses/set-course-order-and-content-grouping',
      'manage-learners/add-and-remove-people-from-a-course',
      'manage-learners/review-a-learners-course-progress',
      'deliver-and-engage/post-a-course-announcement'
    ]
  },
  {
    area: 'Delivery: live classes, attendance, submissions and marks',
    description: 'Run live sessions, take attendance, review and grade submissions, and export marks.',
    articles: [
      'create-and-deliver/live-class',
      'create-and-deliver/take-attendance',
      'deliver-and-engage/understand-the-submission-workflow',
      'create-and-deliver/grade-exercise',
      'deliver-and-engage/grade-an-exercise-with-ai',
      'deliver-and-engage/view-and-export-marks'
    ]
  },
  {
    area: 'Certificates',
    description: 'Design certificates, set eligibility rules, add signatories, and review certificate reports.',
    articles: [
      'deliver-and-engage/design-a-course-certificate',
      'deliver-and-engage/set-certificate-eligibility-rules',
      'deliver-and-engage/add-certificate-signatories',
      'deliver-and-engage/review-certificate-reports',
      'deliver-and-engage/help-a-learner-download-a-certificate'
    ]
  },
  {
    area: 'Compliance training',
    description: 'Recurring compliance courses, active cycles, learner history, and organization-wide monitoring.',
    articles: [
      'deliver-and-engage/understand-compliance-courses',
      'deliver-and-engage/configure-recurring-compliance-training',
      'deliver-and-engage/manage-active-compliance-cycles',
      'deliver-and-engage/review-learner-compliance-history',
      'deliver-and-engage/monitor-organization-compliance',
      'analytics-and-reporting/report-on-compliance-status'
    ]
  },
  {
    area: 'AI tutor',
    description: 'Organization-wide and per-course AI tutor settings, and how learners use it.',
    articles: [
      'deliver-and-engage/set-organization-wide-ai-tutor-defaults',
      'deliver-and-engage/override-ai-tutor-settings-for-a-course',
      'deliver-and-engage/use-ai-tutor-as-a-learner',
      'account-team-security/view-and-manage-ai-credits'
    ]
  },
  {
    area: 'Audience',
    description: 'Browse, filter, import, export, and assign learners across the organization.',
    articles: [
      'manage-students/manage-your-audience',
      'manage-learners/browse-search-and-filter-your-audience',
      'manage-learners/import-learners-from-a-csv-file',
      'manage-learners/export-your-audience',
      'manage-learners/view-a-learner-profile-and-activity',
      'manage-learners/assign-learners-to-courses-in-bulk',
      'manage-students/invite-students',
      'manage-students/course-enrollment'
    ]
  },
  {
    area: 'Cohorts',
    description: 'Create cohorts, add courses and learners, set goals, and post to the cohort news feed.',
    articles: [
      'reference/cohorts',
      'manage-students/create-a-cohort',
      'manage-learners/add-courses-to-a-cohort',
      'manage-learners/assign-learners-to-a-cohort',
      'manage-learners/configure-cohort-goals-and-settings',
      'manage-learners/post-to-a-cohort-news-feed'
    ]
  },
  {
    area: 'Community',
    description: 'The community forum, questions and answers, and moderation.',
    articles: [
      'reference/community',
      'integrations/use-the-community-forum',
      'deliver-and-engage/moderate-community-questions-and-answers'
    ]
  },
  {
    area: 'Tags',
    description: 'Organize courses with tags and tag groups.',
    articles: ['organization-and-team/manage-tags', 'reference/tags']
  },
  {
    area: 'Widgets',
    description: 'Embeddable course widgets: create, design, embed, version, and archive.',
    articles: [
      'publish-and-brand/create-a-course-widget',
      'publish-and-brand/choose-courses-layout-and-design',
      'publish-and-brand/embed-a-widget-on-another-website',
      'publish-and-brand/use-widget-version-history',
      'publish-and-brand/archive-or-restore-a-widget'
    ]
  },
  {
    area: 'Academy landing page and course landing pages',
    description: 'Themes, navigation, catalog section, footer, publishing, and per-course landing pages and pricing.',
    articles: [
      'publish-and-brand/choose-an-academy-landing-page-theme',
      'publish-and-brand/edit-navigation-and-hero-actions',
      'publish-and-brand/configure-the-course-catalog-section',
      'publish-and-brand/edit-the-academy-footer',
      'publish-and-brand/preview-and-publish-the-academy-landing-page',
      'publish-and-brand/course-landingpage',
      'publish-and-brand/set-course-pricing-and-currency',
      'publish-and-brand/configure-enrollment-calls-to-action'
    ]
  },
  {
    area: 'Branding, domains and learner experience settings',
    description:
      'Custom domain, DNS and SSL, learner dashboard, sign-in background, navigation tabs, and student emails.',
    articles: [
      'publish-and-brand/custom-domain',
      'publish-and-brand/add-the-required-dns-records',
      'publish-and-brand/verify-your-domain-and-ssl-certificate',
      'publish-and-brand/reconnect-a-domain-that-needs-attention',
      'publish-and-brand/choose-which-lms-navigation-tabs-learners-see',
      'publish-and-brand/customize-the-learner-dashboard-banner',
      'publish-and-brand/customize-the-sign-in-background',
      'publish-and-brand/customize-student-emails',
      'organization-and-team/customize-organization'
    ]
  },
  {
    area: 'Automation: API, MCP and webhooks',
    description: 'API keys, MCP keys and clients, webhooks, and other integrations.',
    articles: [
      'integrations-and-automation/understand-classroomio-integrations',
      'integrations-and-automation/create-and-manage-api-keys',
      'integrations-and-automation/authenticate-an-api-request',
      'integrations-and-automation/understand-classroomio-mcp',
      'integrations-and-automation/create-rotate-and-revoke-mcp-keys',
      'integrations-and-automation/connect-claude-code-codex-cursor-or-opencode',
      'integrations-and-automation/understand-mcp-limits-and-permissions',
      'integrations-and-automation/create-and-manage-webhooks'
    ]
  },
  {
    area: 'Team, organizations, plan and security settings',
    description: 'Team members, roles, organizations, billing, limits, sign-in methods, SSO, and token auth.',
    articles: [
      'account-team-security/update-organization-settings',
      'account-team-security/invite-a-team-member-by-email',
      'account-team-security/invite-a-team-member-with-a-link',
      'account-team-security/remove-a-team-member',
      'organization-and-team/roles-and-permissions',
      'account-team-security/create-another-organization',
      'account-team-security/switch-between-organizations',
      'account-team-security/view-and-change-your-plan',
      'account-team-security/understand-student-and-organization-limits',
      'account-team-security/manage-your-notification-preferences',
      'organization-and-team/search-the-dashboard-and-settings',
      'account-team-security/choose-allowed-sign-in-methods',
      'account-team-security/configure-sso-access-policies',
      'account-team-security/set-up-token-based-authentication'
    ]
  },
  {
    area: 'Getting started',
    description: 'Sign up, the onboarding checklist, and your first academy and course.',
    articles: [
      'get-started/what-is-classroomio',
      'get-started/signup',
      'get-started/onboarding',
      'get-started/use-the-setup-page',
      'get-started/see-whats-new-in-classroomio',
      'get-started/create-first-course',
      'get-started/customize-your-academy-profile',
      'get-started/preview-your-academy-as-a-learner',
      'get-started/compare-plans-and-feature-limits'
    ]
  },
  {
    area: 'Learner experience',
    description:
      'What students see: sign-in, invitations, joining and navigating courses, exercises, and certificates.',
    articles: [
      'reference/student-dashboard',
      'publish-and-brand/student-home',
      'learner-guides/sign-in-and-reset-your-password',
      'learner-guides/accept-an-academy-or-course-invitation',
      'learner-guides/enroll-yourself-in-a-course',
      'learner-guides/navigate-lessons-and-exercises',
      'learner-guides/complete-and-submit-an-exercise',
      'learner-guides/know-when-you-qualify-for-a-certificate',
      'learner-guides/view-and-download-your-certificates',
      'student-guides/join-a-live-class'
    ]
  }
];
