import { defineConfig } from 'blume';
import { z } from 'zod';

/**
 * The site is served at classroomio.com/help, proxied to this worker by the
 * marketing site (apps/website/src/hooks.server.ts). `deployment.base` only
 * rewrites URLs in the emitted HTML — it does not nest the build output, so
 * scripts/package-assets.mjs moves dist/ under help/ to match the served path.
 *
 * `navigation.sidebar` below is explicit and fully replaces Blume's generated
 * folder-tree sidebar — order is purely each item's position in this array.
 *
 * The sidebar uses three levels: top-level sections, direct article links,
 * and collapsible task groups. The order is intentional and follows the
 * help-center information architecture proposal.
 */
export default defineConfig({
  title: 'ClassroomIO Help Center',
  description: 'Guides for running your ClassroomIO academy, from signup to publishing.',
  logo: {
    text: 'ClassroomIO',
    image: '/help/logo-192.png',
    href: '/help'
  },
  content: {
    root: 'content/help'
  },
  deployment: {
    output: 'static',
    site: 'https://classroomio.com',
    base: '/help'
  },
  github: {
    owner: 'classroomio',
    repo: 'classroomio',
    dir: 'apps/help'
  },
  theme: {
    mode: 'system',
    accent: '#1d4ed8'
  },
  // `last_reviewed` is the staleness field scripts/check-stale-docs.mjs reads.
  // Blume's page frontmatter schema is strict, so without this it fails the
  // build on any page that sets it.
  frontmatter: {
    extend: {
      last_reviewed: z.string().optional()
    }
  },
  search: {
    provider: 'orama'
  },
  ai: {
    llmsTxt: true
  },
  seo: {
    // Read directly from `public/` by Blume's OG renderer — unlike
    // `logo.image` below, this is NOT rewritten with the `/help` deployment
    // base, so it must be the public-relative path, not the served URL.
    og: {
      logo: '/logo.svg'
    },
    x: {
      creator: '@classroomio',
      handle: '@classroomio'
    }
  },
  navigation: {
    tabs: [
      { label: 'Help Center', path: '/', icon: 'book-open' },
      { label: 'Developers', path: 'https://classroomio.com/docs/developers', icon: 'terminal' },
      { label: 'API', path: 'https://classroomio.com/docs/api', icon: 'code' }
    ],
    // New groups must nest inside a section below — register-sidebar-pages.mjs only recurses into those.
    sidebar: [
      '/',
      {
        label: 'Get started',
        display: 'flat',
        items: [
          {
            label: 'What is ClassroomIO?',
            root: '/get-started/what-is-classroomio'
          },
          {
            label: 'Create your ClassroomIO account',
            root: '/get-started/signup'
          },
          {
            label: 'Understand the admin dashboard',
            root: '/organization-and-team/admin-dashboard'
          },
          {
            label: 'Set up your first academy',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Complete your onboarding checklist',
                root: '/get-started/onboarding'
              },
              {
                label: 'Create your first course',
                root: '/get-started/create-first-course'
              },
              {
                label: 'Customize your academy profile',
                root: '/get-started/customize-your-academy-profile'
              },
              {
                label: 'Invite your first team member',
                root: '/organization-and-team/invite-team-member'
              },
              {
                label: 'Preview your academy as a learner',
                root: '/get-started/preview-your-academy-as-a-learner'
              }
            ]
          },
          {
            label: 'Plans, billing, and workspaces',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Compare plans and feature limits',
                root: '/get-started/compare-plans-and-feature-limits'
              },
              {
                label: 'Manage your subscription and billing',
                root: '/get-started/manage-your-subscription-and-billing'
              },
              {
                label: 'Understand usage and plan limits',
                root: '/get-started/understand-usage-and-plan-limits'
              },
              {
                label: 'Create and manage workspaces',
                root: '/get-started/create-and-manage-workspaces'
              }
            ]
          },
          '/get-started/compare-plans-and-feature-limits',
          '/get-started/create-and-manage-workspaces',
          '/get-started/customize-your-academy-profile',
          '/get-started/manage-your-subscription-and-billing',
          '/get-started/preview-your-academy-as-a-learner',
          '/get-started/understand-usage-and-plan-limits'
        ]
      },
      {
        label: 'Build courses',
        display: 'flat',
        items: [
          {
            label: 'Create a course',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Create a course from scratch',
                root: '/build-courses/create-a-course-from-scratch'
              },
              {
                label: 'Create a course with AI',
                root: '/build-courses/create-a-course-with-ai'
              },
              {
                label: 'Create a course from a template',
                root: '/build-courses/create-a-course-from-a-template'
              },
              {
                label: 'Duplicate or import a course',
                root: '/build-courses/duplicate-or-import-a-course'
              },
              '/build-courses/add-a-course-callout',
              '/build-courses/add-documents-and-downloads',
              '/build-courses/add-or-upload-a-video',
              '/build-courses/add-slides-and-presentations',
              '/build-courses/choose-an-exercise-question-type',
              '/build-courses/create-a-compliance-course',
              '/build-courses/create-a-live-class-course',
              '/build-courses/create-a-public-course',
              '/build-courses/create-a-self-paced-course',
              '/build-courses/create-an-exercise-with-ai-or-a-template',
              '/build-courses/create-and-edit-a-lesson',
              '/build-courses/create-and-reorder-lessons-and-exercises',
              '/build-courses/enable-comments-and-course-downloads',
              '/build-courses/organize-content-with-sections',
              '/build-courses/preview-an-exercise-before-publishing',
              '/build-courses/publish-a-course-and-allow-self-enrollment',
              '/build-courses/recover-drafts-and-use-version-history',
              '/build-courses/reorder-exercise-questions',
              '/build-courses/set-answers-points-and-automatic-grading',
              '/build-courses/set-course-order-and-content-grouping',
              '/build-courses/turn-content-grouping-on-or-off',
              '/build-courses/update-course-details-and-cover-image',
              '/build-courses/write-lesson-content-in-the-editor'
            ]
          },
          {
            label: 'Choose a course type',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Compare ClassroomIO course types',
                root: '/create-and-deliver/course-types'
              },
              {
                label: 'Create a self-paced course',
                root: '/build-courses/create-a-self-paced-course'
              },
              {
                label: 'Create a live class course',
                root: '/build-courses/create-a-live-class-course'
              },
              {
                label: 'Create a compliance course',
                root: '/build-courses/create-a-compliance-course'
              },
              {
                label: 'Create a public course',
                root: '/build-courses/create-a-public-course'
              }
            ]
          },
          {
            label: 'Organize course content',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Organize content with sections',
                root: '/build-courses/organize-content-with-sections'
              },
              {
                label: 'Create and reorder lessons and exercises',
                root: '/build-courses/create-and-reorder-lessons-and-exercises'
              },
              {
                label: 'Turn content grouping on or off',
                root: '/build-courses/turn-content-grouping-on-or-off'
              }
            ]
          },
          {
            label: 'Build lessons',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Create and edit a lesson',
                root: '/build-courses/create-and-edit-a-lesson'
              },
              {
                label: 'Write lesson content in the editor',
                root: '/build-courses/write-lesson-content-in-the-editor'
              },
              {
                label: 'Add math and LaTeX',
                root: '/create-and-deliver/use-math-in-editor'
              },
              {
                label: 'Add or upload a video',
                root: '/build-courses/add-or-upload-a-video'
              },
              {
                label: 'Add slides and presentations',
                root: '/build-courses/add-slides-and-presentations'
              },
              {
                label: 'Add documents and downloads',
                root: '/build-courses/add-documents-and-downloads'
              },
              {
                label: 'Recover drafts and use version history',
                root: '/build-courses/recover-drafts-and-use-version-history'
              }
            ]
          },
          {
            label: 'Build exercises',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Create an exercise',
                root: '/create-and-deliver/create-exercise'
              },
              {
                label: 'Create an exercise with AI or a template',
                root: '/build-courses/create-an-exercise-with-ai-or-a-template'
              },
              {
                label: 'Choose an exercise question type',
                root: '/build-courses/choose-an-exercise-question-type'
              },
              {
                label: 'Set answers, points, and automatic grading',
                root: '/build-courses/set-answers-points-and-automatic-grading'
              },
              {
                label: 'Reorder exercise questions',
                root: '/build-courses/reorder-exercise-questions'
              },
              {
                label: 'Preview an exercise before publishing',
                root: '/build-courses/preview-an-exercise-before-publishing'
              }
            ]
          },
          {
            label: 'Configure course settings',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Update course details and cover image',
                root: '/build-courses/update-course-details-and-cover-image'
              },
              {
                label: 'Organize courses with tags',
                root: '/organization-and-team/manage-tags'
              },
              {
                label: 'Set course order and content grouping',
                root: '/build-courses/set-course-order-and-content-grouping'
              },
              {
                label: 'Control progression and completion',
                root: '/create-and-deliver/course-progression'
              },
              {
                label: 'Enable comments and course downloads',
                root: '/build-courses/enable-comments-and-course-downloads'
              },
              {
                label: 'Customize the course welcome email',
                root: '/manage-students/welcome-email'
              },
              {
                label: 'Add a course callout',
                root: '/build-courses/add-a-course-callout'
              },
              {
                label: 'Publish a course and allow self-enrollment',
                root: '/build-courses/publish-a-course-and-allow-self-enrollment'
              }
            ]
          }
        ]
      },
      {
        label: 'Manage learners',
        display: 'flat',
        items: [
          {
            label: 'Understand how course enrollment works',
            root: '/manage-students/course-enrollment'
          },
          {
            label: 'Enroll and invite learners',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Let learners enroll themselves',
                root: '/manage-learners/let-learners-enroll-themselves'
              },
              {
                label: 'Invite learners by email',
                root: '/manage-students/invite-students'
              },
              {
                label: 'Invite learners with a reusable link',
                root: '/manage-learners/invite-learners-with-a-reusable-link'
              },
              {
                label: 'Add a learner directly to a course',
                root: '/manage-learners/add-a-learner-directly-to-a-course'
              },
              {
                label: 'Enroll learners in a paid course',
                root: '/manage-learners/enroll-learners-in-a-paid-course'
              },
              {
                label: 'Restrict enrollment to your organization',
                root: '/manage-students/enrollment-access-control'
              },
              '/manage-learners/add-and-remove-people-from-a-course',
              '/manage-learners/add-courses-to-a-cohort',
              '/manage-learners/assign-learners-to-a-cohort',
              '/manage-learners/assign-learners-to-courses-in-bulk',
              '/manage-learners/browse-search-and-filter-your-audience',
              '/manage-learners/configure-cohort-goals-and-settings',
              '/manage-learners/export-your-audience',
              '/manage-learners/import-learners-from-a-csv-file',
              '/manage-learners/manage-pending-invitations',
              '/manage-learners/post-to-a-cohort-news-feed',
              '/manage-learners/review-a-learners-course-progress',
              '/manage-learners/view-a-learner-profile-and-activity'
            ]
          },
          {
            label: 'Manage your audience',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Browse, search, and filter your audience',
                root: '/manage-learners/browse-search-and-filter-your-audience'
              },
              {
                label: 'View a learner profile and activity',
                root: '/manage-learners/view-a-learner-profile-and-activity'
              },
              {
                label: 'Import learners from a CSV file',
                root: '/manage-learners/import-learners-from-a-csv-file'
              },
              {
                label: 'Export your audience',
                root: '/manage-learners/export-your-audience'
              },
              {
                label: 'Assign learners to courses in bulk',
                root: '/manage-learners/assign-learners-to-courses-in-bulk'
              },
              {
                label: 'Manage pending invitations',
                root: '/manage-learners/manage-pending-invitations'
              },
              {
                label: 'Find and remove inactive learners',
                root: '/manage-students/find-and-remove-inactive-students'
              }
            ]
          },
          {
            label: 'Manage people in a course',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Add and remove people from a course',
                root: '/manage-learners/add-and-remove-people-from-a-course'
              },
              {
                label: 'Review a learner’s course progress',
                root: '/manage-learners/review-a-learners-course-progress'
              }
            ]
          },
          {
            label: 'Organize learners with cohorts',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Understand cohorts and goals',
                root: '/reference/cohorts'
              },
              {
                label: 'Create a cohort',
                root: '/manage-students/create-a-cohort'
              },
              {
                label: 'Add courses to a cohort',
                root: '/manage-learners/add-courses-to-a-cohort'
              },
              {
                label: 'Assign learners to a cohort',
                root: '/manage-learners/assign-learners-to-a-cohort'
              },
              {
                label: 'Configure cohort goals and settings',
                root: '/manage-learners/configure-cohort-goals-and-settings'
              },
              {
                label: 'Post to a cohort news feed',
                root: '/manage-learners/post-to-a-cohort-news-feed'
              }
            ]
          }
        ]
      },
      {
        label: 'Deliver and engage',
        display: 'flat',
        items: [
          {
            label: 'Run live classes',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Schedule a live class',
                root: '/create-and-deliver/live-class'
              },
              {
                label: 'Change a live class time or join link',
                root: '/deliver-and-engage/change-a-live-class-time-or-join-link'
              },
              {
                label: 'Send reminders and calendar invitations',
                root: '/deliver-and-engage/send-reminders-and-calendar-invitations'
              },
              {
                label: 'Take attendance',
                root: '/create-and-deliver/take-attendance'
              },
              '/deliver-and-engage/add-certificate-signatories',
              '/deliver-and-engage/choose-free-or-sequential-progression',
              '/deliver-and-engage/configure-recurring-compliance-training',
              '/deliver-and-engage/design-a-course-certificate',
              '/deliver-and-engage/grade-an-exercise-with-ai',
              '/deliver-and-engage/help-a-learner-download-a-certificate',
              '/deliver-and-engage/manage-active-compliance-cycles',
              '/deliver-and-engage/moderate-community-questions-and-answers',
              '/deliver-and-engage/monitor-organization-compliance',
              '/deliver-and-engage/notify-learners-about-an-exercise',
              '/deliver-and-engage/override-ai-tutor-settings-for-a-course',
              '/deliver-and-engage/post-a-course-announcement',
              '/deliver-and-engage/review-certificate-reports',
              '/deliver-and-engage/review-learner-compliance-history',
              '/deliver-and-engage/set-certificate-eligibility-rules',
              '/deliver-and-engage/set-exercise-completion-rules',
              '/deliver-and-engage/set-lesson-completion-rules',
              '/deliver-and-engage/set-organization-wide-ai-tutor-defaults',
              '/deliver-and-engage/understand-compliance-courses',
              '/deliver-and-engage/understand-locked-course-content',
              '/deliver-and-engage/understand-the-submission-workflow',
              '/deliver-and-engage/use-ai-tutor-as-a-learner',
              '/deliver-and-engage/view-and-export-marks'
            ]
          },
          {
            label: 'Review and grade work',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Understand the submission workflow',
                root: '/deliver-and-engage/understand-the-submission-workflow'
              },
              {
                label: 'Grade an exercise manually',
                root: '/create-and-deliver/grade-exercise'
              },
              {
                label: 'Grade an exercise with AI',
                root: '/deliver-and-engage/grade-an-exercise-with-ai'
              },
              {
                label: 'View and export marks',
                root: '/deliver-and-engage/view-and-export-marks'
              },
              {
                label: 'Notify learners about an exercise',
                root: '/deliver-and-engage/notify-learners-about-an-exercise'
              }
            ]
          },
          {
            label: 'Control progression and completion',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Choose free or sequential progression',
                root: '/deliver-and-engage/choose-free-or-sequential-progression'
              },
              {
                label: 'Set lesson completion rules',
                root: '/deliver-and-engage/set-lesson-completion-rules'
              },
              {
                label: 'Set exercise completion rules',
                root: '/deliver-and-engage/set-exercise-completion-rules'
              },
              {
                label: 'Understand locked course content',
                root: '/deliver-and-engage/understand-locked-course-content'
              }
            ]
          },
          {
            label: 'Issue certificates',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Set certificate eligibility rules',
                root: '/deliver-and-engage/set-certificate-eligibility-rules'
              },
              {
                label: 'Design a course certificate',
                root: '/deliver-and-engage/design-a-course-certificate'
              },
              {
                label: 'Add certificate signatories',
                root: '/deliver-and-engage/add-certificate-signatories'
              },
              {
                label: 'Review certificate reports',
                root: '/deliver-and-engage/review-certificate-reports'
              },
              {
                label: 'Help a learner download a certificate',
                root: '/deliver-and-engage/help-a-learner-download-a-certificate'
              }
            ]
          },
          {
            label: 'Manage compliance training',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Understand compliance courses',
                root: '/deliver-and-engage/understand-compliance-courses'
              },
              {
                label: 'Configure recurring compliance training',
                root: '/deliver-and-engage/configure-recurring-compliance-training'
              },
              {
                label: 'Manage active compliance cycles',
                root: '/deliver-and-engage/manage-active-compliance-cycles'
              },
              {
                label: 'Review learner compliance history',
                root: '/deliver-and-engage/review-learner-compliance-history'
              },
              {
                label: 'Monitor organization compliance',
                root: '/deliver-and-engage/monitor-organization-compliance'
              }
            ]
          },
          {
            label: 'Use Community and news feeds',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Understand the Community forum',
                root: '/reference/community'
              },
              {
                label: 'Ask and answer a Community question',
                root: '/integrations/use-the-community-forum'
              },
              {
                label: 'Moderate Community questions and answers',
                root: '/deliver-and-engage/moderate-community-questions-and-answers'
              },
              {
                label: 'Post a course announcement',
                root: '/deliver-and-engage/post-a-course-announcement'
              }
            ]
          },
          {
            label: 'Configure AI Tutor',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Set organization-wide AI Tutor defaults',
                root: '/deliver-and-engage/set-organization-wide-ai-tutor-defaults'
              },
              {
                label: 'Override AI Tutor settings for a course',
                root: '/deliver-and-engage/override-ai-tutor-settings-for-a-course'
              },
              {
                label: 'Use AI Tutor as a learner',
                root: '/deliver-and-engage/use-ai-tutor-as-a-learner'
              }
            ]
          }
        ]
      },
      {
        label: 'Publish and brand',
        display: 'flat',
        items: [
          {
            label: 'Customize your organization profile and theme',
            root: '/organization-and-team/customize-organization'
          },
          {
            label: 'Set your favicon and social sharing preview',
            root: '/publish-and-brand/academy-sharing-and-branding'
          },
          {
            label: 'Customize the learner LMS',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Choose which LMS navigation tabs learners see',
                root: '/publish-and-brand/choose-which-lms-navigation-tabs-learners-see'
              },
              {
                label: 'Customize the learner dashboard banner',
                root: '/publish-and-brand/customize-the-learner-dashboard-banner'
              },
              {
                label: 'Show course news feeds and grading',
                root: '/publish-and-brand/show-course-news-feeds-and-grading'
              },
              {
                label: 'Configure polls and live comments',
                root: '/publish-and-brand/configure-polls-and-live-comments'
              },
              {
                label: 'Customize the sign-in background',
                root: '/publish-and-brand/customize-the-sign-in-background'
              }
            ]
          },
          {
            label: 'Build your academy landing page',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Choose an academy landing page theme',
                root: '/publish-and-brand/choose-an-academy-landing-page-theme'
              },
              {
                label: 'Edit navigation and hero actions',
                root: '/publish-and-brand/edit-navigation-and-hero-actions'
              },
              {
                label: 'Configure the course catalog section',
                root: '/publish-and-brand/configure-the-course-catalog-section'
              },
              {
                label: 'Add embeds, links, and callouts',
                root: '/publish-and-brand/add-embeds-links-and-callouts'
              },
              {
                label: 'Edit the academy footer',
                root: '/publish-and-brand/edit-the-academy-footer'
              },
              {
                label: 'Preview and publish the academy landing page',
                root: '/publish-and-brand/preview-and-publish-the-academy-landing-page'
              }
            ]
          },
          {
            label: 'Build a course landing page',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Open and edit a course landing page',
                root: '/publish-and-brand/course-landingpage'
              },
              {
                label: 'Set course pricing and currency',
                root: '/publish-and-brand/set-course-pricing-and-currency'
              },
              {
                label: 'Configure enrollment calls to action',
                root: '/publish-and-brand/configure-enrollment-calls-to-action'
              },
              {
                label: 'Preview and publish a course landing page',
                root: '/publish-and-brand/preview-and-publish-a-course-landing-page'
              }
            ]
          },
          {
            label: 'Connect a custom domain',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Add the required DNS records',
                root: '/publish-and-brand/add-the-required-dns-records'
              },
              {
                label: 'Verify your domain and SSL certificate',
                root: '/publish-and-brand/verify-your-domain-and-ssl-certificate'
              },
              {
                label: 'Reconnect a domain that needs attention',
                root: '/publish-and-brand/reconnect-a-domain-that-needs-attention'
              },
              {
                label: 'Add a custom favicon or custom code',
                root: '/publish-and-brand/add-a-custom-favicon-or-custom-code'
              },
              {
                label: 'Understand which links use your custom domain',
                root: '/publish-and-brand/custom-domain'
              }
            ]
          },
          {
            label: 'Create and embed course widgets',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Create a course widget',
                root: '/publish-and-brand/create-a-course-widget'
              },
              {
                label: 'Choose courses, layout, and design',
                root: '/publish-and-brand/choose-courses-layout-and-design'
              },
              {
                label: 'Embed a widget on another website',
                root: '/publish-and-brand/embed-a-widget-on-another-website'
              },
              {
                label: 'Use widget version history',
                root: '/publish-and-brand/use-widget-version-history'
              },
              {
                label: 'Archive or restore a widget',
                root: '/publish-and-brand/archive-or-restore-a-widget'
              }
            ]
          },
          '/publish-and-brand/add-a-custom-favicon-or-custom-code',
          '/publish-and-brand/add-embeds-links-and-callouts',
          '/publish-and-brand/add-the-required-dns-records',
          '/publish-and-brand/archive-or-restore-a-widget',
          '/publish-and-brand/choose-an-academy-landing-page-theme',
          '/publish-and-brand/choose-courses-layout-and-design',
          '/publish-and-brand/choose-which-lms-navigation-tabs-learners-see',
          '/publish-and-brand/configure-enrollment-calls-to-action',
          '/publish-and-brand/configure-polls-and-live-comments',
          '/publish-and-brand/configure-the-course-catalog-section',
          '/publish-and-brand/create-a-course-widget',
          '/publish-and-brand/customize-the-learner-dashboard-banner',
          '/publish-and-brand/customize-the-sign-in-background',
          '/publish-and-brand/edit-navigation-and-hero-actions',
          '/publish-and-brand/edit-the-academy-footer',
          '/publish-and-brand/embed-a-widget-on-another-website',
          '/publish-and-brand/preview-and-publish-a-course-landing-page',
          '/publish-and-brand/preview-and-publish-the-academy-landing-page',
          '/publish-and-brand/reconnect-a-domain-that-needs-attention',
          '/publish-and-brand/set-course-pricing-and-currency',
          '/publish-and-brand/show-course-news-feeds-and-grading',
          '/publish-and-brand/use-widget-version-history',
          '/publish-and-brand/verify-your-domain-and-ssl-certificate'
        ]
      },
      {
        label: 'Analytics and reporting',
        display: 'flat',
        items: [
          {
            label: 'Understand the organization dashboard',
            root: '/analytics-and-reporting/understand-the-organization-dashboard'
          },
          {
            label: 'Use organization analytics',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Read your organization analytics overview',
                root: '/analytics-and-reporting/read-your-organization-analytics-overview'
              },
              {
                label: 'Analyze landing views, enrollments, and completions',
                root: '/analytics-and-reporting/analyze-landing-views-enrollments-and-completions'
              },
              {
                label: 'View top countries and popular course types',
                root: '/analytics-and-reporting/view-top-countries-and-popular-course-types'
              },
              {
                label: 'Compare your top courses',
                root: '/analytics-and-reporting/compare-your-top-courses'
              }
            ]
          },
          {
            label: 'Use course analytics',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Review course performance and learner progress',
                root: '/analytics-and-reporting/review-course-performance-and-learner-progress'
              },
              {
                label: 'View submissions and completion data',
                root: '/analytics-and-reporting/view-submissions-and-completion-data'
              }
            ]
          },
          {
            label: 'View a learner’s analytics',
            root: '/analytics-and-reporting/view-a-learners-analytics'
          },
          {
            label: 'Export audiences, marks, and reports',
            root: '/reference/exports'
          },
          {
            label: 'Report on compliance status',
            root: '/analytics-and-reporting/report-on-compliance-status'
          },
          '/analytics-and-reporting/analyze-landing-views-enrollments-and-completions',
          '/analytics-and-reporting/compare-your-top-courses',
          '/analytics-and-reporting/read-your-organization-analytics-overview',
          '/analytics-and-reporting/review-course-performance-and-learner-progress',
          '/analytics-and-reporting/view-submissions-and-completion-data',
          '/analytics-and-reporting/view-top-countries-and-popular-course-types'
        ]
      },
      {
        label: 'Account, team, and security',
        display: 'flat',
        items: [
          {
            label: 'Update your personal profile',
            root: '/account-team-security/update-your-personal-profile'
          },
          {
            label: 'Manage your notification preferences',
            root: '/account-team-security/manage-your-notification-preferences'
          },
          {
            label: 'Update organization settings',
            root: '/account-team-security/update-organization-settings'
          },
          {
            label: 'Manage your team',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Invite a team member by email',
                root: '/account-team-security/invite-a-team-member-by-email'
              },
              {
                label: 'Invite a team member with a link',
                root: '/account-team-security/invite-a-team-member-with-a-link'
              },
              {
                label: 'Choose admin and tutor roles',
                root: '/organization-and-team/roles-and-permissions'
              },
              {
                label: 'Remove a team member',
                root: '/account-team-security/remove-a-team-member'
              }
            ]
          },
          {
            label: 'Manage workspaces',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Understand primary and secondary workspaces',
                root: '/account-team-security/understand-primary-and-secondary-workspaces'
              },
              {
                label: 'Create another workspace',
                root: '/account-team-security/create-another-workspace'
              },
              {
                label: 'Switch between workspaces',
                root: '/account-team-security/switch-between-workspaces'
              },
              {
                label: 'Delete a workspace',
                root: '/account-team-security/delete-a-workspace'
              }
            ]
          },
          {
            label: 'Manage billing and usage',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'View and change your plan',
                root: '/account-team-security/view-and-change-your-plan'
              },
              {
                label: 'Understand student and workspace limits',
                root: '/account-team-security/understand-student-and-workspace-limits'
              },
              {
                label: 'View and manage AI credits',
                root: '/account-team-security/view-and-manage-ai-credits'
              }
            ]
          },
          {
            label: 'Configure authentication',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Choose allowed sign-in methods',
                root: '/account-team-security/choose-allowed-sign-in-methods'
              },
              {
                label: 'Set up enterprise SSO',
                root: '/integrations/enterprise-sso-setup'
              },
              {
                label: 'Configure SSO access policies',
                root: '/account-team-security/configure-sso-access-policies'
              },
              {
                label: 'Set up token-based authentication',
                root: '/account-team-security/set-up-token-based-authentication'
              }
            ]
          },
          '/account-team-security/choose-allowed-sign-in-methods',
          '/account-team-security/configure-sso-access-policies',
          '/account-team-security/create-another-workspace',
          '/account-team-security/delete-a-workspace',
          '/account-team-security/invite-a-team-member-by-email',
          '/account-team-security/invite-a-team-member-with-a-link',
          '/account-team-security/remove-a-team-member',
          '/account-team-security/set-up-token-based-authentication',
          '/account-team-security/switch-between-workspaces',
          '/account-team-security/understand-primary-and-secondary-workspaces',
          '/account-team-security/understand-student-and-workspace-limits',
          '/account-team-security/view-and-change-your-plan',
          '/account-team-security/view-and-manage-ai-credits'
        ]
      },
      {
        label: 'Integrations and automation',
        display: 'flat',
        items: [
          {
            label: 'Understand ClassroomIO integrations',
            root: '/integrations-and-automation/understand-classroomio-integrations'
          },
          {
            label: 'Connect AI tools with MCP',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Understand ClassroomIO MCP',
                root: '/integrations-and-automation/understand-classroomio-mcp'
              },
              {
                label: 'Create, rotate, and revoke MCP keys',
                root: '/integrations-and-automation/create-rotate-and-revoke-mcp-keys'
              },
              {
                label: 'Connect Claude Code, Codex, Cursor, or OpenCode',
                root: '/integrations-and-automation/connect-claude-code-codex-cursor-or-opencode'
              },
              {
                label: 'Understand MCP limits and permissions',
                root: '/integrations-and-automation/understand-mcp-limits-and-permissions'
              }
            ]
          },
          {
            label: 'Use the public API',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Create and manage API keys',
                root: '/integrations-and-automation/create-and-manage-api-keys'
              },
              {
                label: 'Authenticate an API request',
                root: '/integrations-and-automation/authenticate-an-api-request'
              },
              {
                label: 'Open the API reference',
                href: 'https://classroomio.com/docs/api'
              }
            ]
          },
          {
            label: 'Open the developer documentation',
            href: 'https://classroomio.com/docs/developers'
          },
          '/integrations-and-automation/authenticate-an-api-request',
          '/integrations-and-automation/connect-claude-code-codex-cursor-or-opencode',
          '/integrations-and-automation/create-and-manage-api-keys',
          '/integrations-and-automation/create-rotate-and-revoke-mcp-keys',
          '/integrations-and-automation/understand-classroomio-mcp',
          '/integrations-and-automation/understand-mcp-limits-and-permissions'
        ]
      },
      {
        label: 'Learner guides',
        display: 'flat',
        items: [
          {
            label: 'Join and manage your account',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Accept an academy or course invitation',
                root: '/learner-guides/accept-an-academy-or-course-invitation'
              },
              {
                label: 'Enroll yourself in a course',
                root: '/learner-guides/enroll-yourself-in-a-course'
              },
              {
                label: 'Join a paid course',
                root: '/learner-guides/join-a-paid-course'
              },
              {
                label: 'Sign in and reset your password',
                root: '/learner-guides/sign-in-and-reset-your-password'
              },
              {
                label: 'Update your profile and preferences',
                root: '/learner-guides/update-your-profile-and-preferences'
              },
              '/learner-guides/answer-edit-or-remove-a-post',
              '/learner-guides/complete-and-submit-an-exercise',
              '/learner-guides/discover-courses-in-explore',
              '/learner-guides/find-courses-in-my-learning',
              '/learner-guides/know-when-you-qualify-for-a-certificate',
              '/learner-guides/navigate-lessons-and-exercises',
              '/learner-guides/understand-locked-content-and-progression',
              '/learner-guides/view-and-download-your-certificates',
              '/learner-guides/view-marks-and-instructor-feedback',
              '/learner-guides/view-your-cohorts-and-goals'
            ]
          },
          {
            label: 'Navigate the learner LMS',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Use your learner dashboard',
                root: '/reference/student-dashboard'
              },
              {
                label: 'Find courses in My Learning',
                root: '/learner-guides/find-courses-in-my-learning'
              },
              {
                label: 'Discover courses in Explore',
                root: '/learner-guides/discover-courses-in-explore'
              },
              {
                label: 'View your cohorts and goals',
                root: '/learner-guides/view-your-cohorts-and-goals'
              }
            ]
          },
          {
            label: 'Take a course',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Navigate lessons and exercises',
                root: '/learner-guides/navigate-lessons-and-exercises'
              },
              {
                label: 'Understand locked content and progression',
                root: '/learner-guides/understand-locked-content-and-progression'
              },
              {
                label: 'Complete and submit an exercise',
                root: '/learner-guides/complete-and-submit-an-exercise'
              },
              {
                label: 'View marks and instructor feedback',
                root: '/learner-guides/view-marks-and-instructor-feedback'
              },
              {
                label: 'Join a live class',
                root: '/student-guides/join-a-live-class'
              }
            ]
          },
          {
            label: 'Participate in Community',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Ask a Community question',
                root: '/student-guides/ask-a-question'
              },
              {
                label: 'Answer, edit, or remove a post',
                root: '/learner-guides/answer-edit-or-remove-a-post'
              }
            ]
          },
          {
            label: 'Use certificates',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Know when you qualify for a certificate',
                root: '/learner-guides/know-when-you-qualify-for-a-certificate'
              },
              {
                label: 'View and download your certificates',
                root: '/learner-guides/view-and-download-your-certificates'
              }
            ]
          }
        ]
      },
      {
        label: 'Troubleshooting and reference',
        display: 'flat',
        items: [
          {
            label: 'Troubleshoot common problems',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Troubleshoot login and verification emails',
                root: '/troubleshooting-and-reference/troubleshoot-login-and-verification-emails'
              },
              {
                label: 'Troubleshoot course access and enrollment',
                root: '/troubleshooting-and-reference/troubleshoot-course-access-and-enrollment'
              },
              {
                label: 'Troubleshoot video uploads and playback',
                root: '/troubleshooting-and-reference/troubleshoot-video-uploads-and-playback'
              },
              {
                label: 'Troubleshoot invitation and notification emails',
                root: '/troubleshooting-and-reference/troubleshoot-invitation-and-notification-emails'
              },
              {
                label: 'Troubleshoot custom domains and SSL',
                root: '/troubleshooting-and-reference/troubleshoot-custom-domains-and-ssl'
              },
              {
                label: 'Troubleshoot course publishing and visibility',
                root: '/troubleshooting-and-reference/troubleshoot-course-publishing-and-visibility'
              }
            ]
          },
          {
            label: 'Supported browsers and devices',
            root: '/troubleshooting-and-reference/supported-browsers-and-devices'
          },
          {
            label: 'Contact ClassroomIO support',
            root: '/troubleshooting-and-reference/contact-classroomio-support'
          },
          {
            label: 'ClassroomIO concepts',
            display: 'group',
            collapsed: true,
            items: [
              {
                label: 'Organization',
                root: '/reference/organization'
              },
              {
                label: 'Workspace',
                root: '/troubleshooting-and-reference/workspace'
              },
              {
                label: 'Course',
                root: '/reference/course'
              },
              {
                label: 'Section, lesson, and exercise',
                root: '/troubleshooting-and-reference/section-lesson-and-exercise'
              },
              {
                label: 'Audience',
                root: '/reference/audience'
              },
              {
                label: 'Cohort',
                root: '/troubleshooting-and-reference/cohort'
              },
              {
                label: 'Community',
                root: '/troubleshooting-and-reference/community'
              },
              {
                label: 'Tags',
                root: '/reference/tags'
              },
              {
                label: 'Certificate and compliance cycle',
                root: '/troubleshooting-and-reference/certificate-and-compliance-cycle'
              }
            ]
          },
          {
            label: 'Roles and permissions reference',
            root: '/troubleshooting-and-reference/roles-and-permissions-reference'
          },
          {
            label: 'Course type comparison',
            root: '/troubleshooting-and-reference/course-type-comparison'
          },
          {
            label: 'Enrollment and visibility reference',
            root: '/troubleshooting-and-reference/enrollment-and-visibility-reference'
          },
          {
            label: 'Exports reference',
            root: '/troubleshooting-and-reference/exports-reference'
          },
          {
            label: 'ClassroomIO glossary',
            root: '/reference/glossary'
          },
          '/troubleshooting-and-reference/certificate-and-compliance-cycle',
          '/troubleshooting-and-reference/cohort',
          '/troubleshooting-and-reference/community',
          '/troubleshooting-and-reference/section-lesson-and-exercise',
          '/troubleshooting-and-reference/troubleshoot-course-access-and-enrollment',
          '/troubleshooting-and-reference/troubleshoot-course-publishing-and-visibility',
          '/troubleshooting-and-reference/troubleshoot-custom-domains-and-ssl',
          '/troubleshooting-and-reference/troubleshoot-invitation-and-notification-emails',
          '/troubleshooting-and-reference/troubleshoot-login-and-verification-emails',
          '/troubleshooting-and-reference/troubleshoot-video-uploads-and-playback',
          '/troubleshooting-and-reference/workspace'
        ]
      }
    ]
  }
});
