import type { TWebhookEventType } from './webhook';

export const ZAPIER_HOOK_HOSTS = ['hooks.zapier.com'] as const;

export const ZAPIER_OAUTH_SCOPES = [
  'offline_access',
  'audience:read',
  'audience:write',
  'course:read',
  'course:member:read',
  'course:member:write',
  'course:student:write',
  'course:certificate:read',
  'cohort:read',
  'cohort:write',
  'webhook:subscription:read',
  'webhook:subscription:write'
] as const;

export const ZAPIER_TRIGGER_FILTERS = ['course', 'cohort', 'source', 'role'] as const;
export type TZapierTriggerFilter = (typeof ZAPIER_TRIGGER_FILTERS)[number];

export type TZapierTriggerPrefill = 'courseId' | 'cohortId';

export type TZapierTrigger = {
  key: string;
  eventType: TWebhookEventType;
  noun: string;
  label: string;
  description: string;
  filters: readonly TZapierTriggerFilter[];
  /** Zapier dropdown field the recipe can pre-fill, when the trigger accepts one. */
  prefill: TZapierTriggerPrefill | null;
};

export const ZAPIER_TRIGGERS = [
  {
    key: 'new_course_enrollment',
    eventType: 'course.member.added',
    noun: 'Enrollment',
    label: 'New Course Enrollment',
    description: 'Triggers when a student is added to a course, however they joined.',
    filters: ['course', 'source'],
    prefill: 'courseId'
  },
  {
    key: 'course_member_removed',
    eventType: 'course.member.removed',
    noun: 'Enrollment',
    label: 'Student Removed From Course',
    description: 'Triggers when a student is removed from a course.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'course_completed',
    eventType: 'course.completed',
    noun: 'Completion',
    label: 'Course Completed',
    description: 'Triggers when a student completes every required lesson in a course.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'new_certificate',
    eventType: 'course.certificate.issued',
    noun: 'Certificate',
    label: 'New Certificate',
    description: 'Triggers when a certificate is issued to a student.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'new_submission',
    eventType: 'course.submission.created',
    noun: 'Submission',
    label: 'New Exercise Submission',
    description: 'Triggers when a student submits an exercise.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'submission_status_changed',
    eventType: 'course.submission.status_changed',
    noun: 'Submission',
    label: 'Submission Status Changed',
    description: 'Triggers when a submission is graded or its status changes.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'lesson_completed',
    eventType: 'lesson.completion.updated',
    noun: 'Lesson Completion',
    label: 'Lesson Completed',
    description: 'Triggers when a student completes a lesson.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'course_invite_accepted',
    eventType: 'course.invite.accepted',
    noun: 'Invite',
    label: 'Course Invite Accepted',
    description: 'Triggers when someone accepts a course invite.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'new_payment_request',
    eventType: 'course.payment_request.created',
    noun: 'Payment Request',
    label: 'New Payment Request',
    description: 'Triggers when a learner submits a payment request for a course.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'new_organization_member',
    eventType: 'organization.member.added',
    noun: 'Member',
    label: 'New Organization Member',
    description: 'Triggers when someone joins the organization as a student, tutor or admin.',
    filters: ['role'],
    prefill: null
  },
  {
    key: 'compliance_status_changed',
    eventType: 'compliance.record.status_changed',
    noun: 'Compliance Record',
    label: 'Compliance Status Changed',
    description: "Triggers when a learner's compliance status changes, for example to overdue or expired.",
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'course_published',
    eventType: 'course.published',
    noun: 'Course',
    label: 'Course Published',
    description: 'Triggers when a course is published.',
    filters: [],
    prefill: null
  },
  {
    key: 'live_session_scheduled',
    eventType: 'lesson.session.scheduled',
    noun: 'Live Session',
    label: 'Live Session Scheduled',
    description: 'Triggers when a live session is scheduled or rescheduled.',
    filters: ['course'],
    prefill: 'courseId'
  },
  {
    key: 'new_cohort_member',
    eventType: 'cohort.member.added',
    noun: 'Cohort Member',
    label: 'New Cohort Member',
    description: 'Triggers when a student is added to a cohort.',
    filters: ['cohort'],
    prefill: 'cohortId'
  }
] as const satisfies readonly TZapierTrigger[];
export type TZapierTriggerKey = (typeof ZAPIER_TRIGGERS)[number]['key'];

export type TZapierActionPrefill = 'courseId' | 'cohortId';

export type TZapierAction = {
  key: string;
  noun: string;
  label: string;
  description: string;
  /** Zapier dropdown field the recipe can pre-fill, when the action requires one. */
  prefill: TZapierActionPrefill | null;
};

export const ZAPIER_ACTIONS = [
  {
    key: 'enroll_student',
    noun: 'Enrollment',
    label: 'Enroll Student in Course',
    description: 'Enrolls a student in a course by email, inviting them first if they are new.',
    prefill: 'courseId'
  },
  {
    key: 'add_student',
    noun: 'Student',
    label: 'Add Student to Organization',
    description: 'Invites a student to your organization without enrolling them in a course.',
    prefill: null
  },
  {
    key: 'update_student',
    noun: 'Student',
    label: 'Update Student',
    description: "Updates a student's name, or the email of an invite that hasn't been accepted.",
    prefill: null
  },
  {
    key: 'remove_student',
    noun: 'Student',
    label: 'Remove Student From Organization',
    description: 'Removes a student from your organization.',
    prefill: null
  },
  {
    key: 'remove_course_member',
    noun: 'Enrollment',
    label: 'Remove Student From Course',
    description: 'Removes a student from one course and keeps them in your organization.',
    prefill: 'courseId'
  },
  {
    key: 'send_course_invite',
    noun: 'Invite',
    label: 'Send Course Invite',
    description: 'Emails an invite to join a course.',
    prefill: 'courseId'
  },
  {
    key: 'revoke_course_invite',
    noun: 'Invite',
    label: 'Revoke Course Invite',
    description: 'Cancels a pending course invite so its link stops working.',
    prefill: null
  },
  {
    key: 'reset_course_progress',
    noun: 'Progress',
    label: 'Reset Student Course Progress',
    description: "Clears a student's progress in a course and keeps them enrolled.",
    prefill: null
  },
  {
    key: 'mark_lesson_complete',
    noun: 'Lesson Completion',
    label: 'Mark Lesson Complete',
    description: 'Marks a lesson complete for a student.',
    prefill: 'courseId'
  },
  {
    key: 'add_cohort_member',
    noun: 'Cohort Member',
    label: 'Add Student to Cohort',
    description: 'Adds a student to a cohort.',
    prefill: 'cohortId'
  },
  {
    key: 'post_cohort_announcement',
    noun: 'Announcement',
    label: 'Post to Cohort Feed',
    description: "Posts an announcement to a cohort's feed.",
    prefill: 'cohortId'
  }
] as const satisfies readonly TZapierAction[];
export type TZapierActionKey = (typeof ZAPIER_ACTIONS)[number]['key'];

export const ZAPIER_SEARCHES = [
  {
    key: 'find_student',
    noun: 'Student',
    label: 'Find Student',
    description: 'Finds a student in your organization by email.'
  },
  {
    key: 'find_course',
    noun: 'Course',
    label: 'Find Course',
    description: 'Finds a course by its slug or exact title.'
  }
] as const;
export type TZapierSearchKey = (typeof ZAPIER_SEARCHES)[number]['key'];

export const ZAPIER_APP_CATEGORIES = [
  'crm',
  'marketing',
  'communication',
  'customer-support',
  'sales',
  'productivity',
  'forms',
  'analytics',
  'community'
] as const;
export type TZapierAppCategory = (typeof ZAPIER_APP_CATEGORIES)[number];

export type TZapierRecipeStep =
  | { app: 'classroomio'; type: 'read'; key: TZapierTriggerKey }
  | { app: 'classroomio'; type: 'write'; key: TZapierActionKey }
  | { app: 'partner'; type: 'read'; key: string; isInstant: boolean }
  | { app: 'partner'; type: 'write'; key: string };

export type TZapierRecipe = {
  id: string;
  trigger: TZapierRecipeStep;
  action: TZapierRecipeStep;
};

export type TZapierPartnerApp = {
  slug: string;
  name: string;
  zapierKey: string;
  category: TZapierAppCategory;
  color: string;
  /** Two-character mark when the name's first two letters collide with another app. */
  monogram?: string;
  isPopular: boolean;
  isRecent: boolean;
  zapierAppId?: string;
  /** Ordered recipes; `recipes[0]` is the primary one used by the hero. */
  recipes: readonly TZapierRecipe[];
};

export const ZAPIER_FEATURED_RECIPE_IDS = [
  'calendly_booking_enroll',
  'slack_completed_channel',
  'hubspot_list_enroll'
] as const;

export const ZAPIER_PARTNER_APPS = [
  {
    slug: 'hubspot',
    name: 'HubSpot',
    zapierKey: 'HubSpotCLIAPI',
    category: 'crm',
    color: '#FF7A59',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'hubspot_deal_stage_enroll',
        trigger: { app: 'partner', type: 'read', key: 'updated_deal_stage', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'hubspot_list_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_contact_in_list_resthook_v3', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'hubspot_form_invite',
        trigger: { app: 'partner', type: 'read', key: 'form_submission_resthook_v3', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'send_course_invite' }
      },
      {
        id: 'hubspot_completed_contact',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'upsert_contact' }
      },
      {
        id: 'hubspot_certificate_list',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'add_to_list_v3' }
      },
      {
        id: 'hubspot_compliance_task',
        trigger: { app: 'classroomio', type: 'read', key: 'compliance_status_changed' },
        action: { app: 'partner', type: 'write', key: 'create_engagement' }
      }
    ]
  },
  {
    slug: 'salesforce',
    name: 'Salesforce',
    zapierKey: 'SalesforceCLIAPI',
    category: 'crm',
    color: '#00A1E0',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'salesforce_certificate_record',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'create_record' }
      },
      {
        id: 'salesforce_completed_contact',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'update_contact' }
      },
      {
        id: 'salesforce_payment_lead',
        trigger: { app: 'classroomio', type: 'read', key: 'new_payment_request' },
        action: { app: 'partner', type: 'write', key: 'create_lead' }
      },
      {
        id: 'salesforce_contact_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_contact', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'salesforce_opportunity_enroll',
        trigger: { app: 'partner', type: 'read', key: 'updated_field_on_record', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    zapierKey: 'MailchimpCLIAPI',
    category: 'marketing',
    color: '#FFE01B',
    isPopular: false,
    isRecent: false,
    recipes: [
      {
        id: 'mailchimp_enrollment_subscriber',
        trigger: { app: 'classroomio', type: 'read', key: 'new_course_enrollment' },
        action: { app: 'partner', type: 'write', key: 'memberCreate' }
      },
      {
        id: 'mailchimp_completed_tag',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'subscriber_segment' }
      },
      {
        id: 'mailchimp_removed_untag',
        trigger: { app: 'classroomio', type: 'read', key: 'course_member_removed' },
        action: { app: 'partner', type: 'write', key: 'remove_tag' }
      },
      {
        id: 'mailchimp_subscriber_student',
        trigger: { app: 'partner', type: 'read', key: 'new_member', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'add_student' }
      },
      {
        id: 'mailchimp_tag_enroll',
        trigger: { app: 'partner', type: 'read', key: 'subscriber_tag', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'customerio',
    name: 'Customer.io',
    zapierKey: 'CustomerIOV2CLIAPI',
    category: 'marketing',
    color: '#5B3DF5',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'customerio_completed_event',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'track_event' }
      },
      {
        id: 'customerio_enrollment_person',
        trigger: { app: 'classroomio', type: 'read', key: 'new_course_enrollment' },
        action: { app: 'partner', type: 'write', key: 'create_customer' }
      },
      {
        id: 'customerio_certificate_event',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'track_event' }
      },
      {
        id: 'customerio_compliance_event',
        trigger: { app: 'classroomio', type: 'read', key: 'compliance_status_changed' },
        action: { app: 'partner', type: 'write', key: 'track_event' }
      },
      {
        id: 'customerio_lesson_event',
        trigger: { app: 'classroomio', type: 'read', key: 'lesson_completed' },
        action: { app: 'partner', type: 'write', key: 'track_event' }
      }
    ]
  },
  {
    slug: 'slack',
    name: 'Slack',
    zapierKey: 'SlackCLIAPI',
    category: 'communication',
    color: '#4A154B',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'slack_completed_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'channel_message' }
      },
      {
        id: 'slack_submission_dm',
        trigger: { app: 'classroomio', type: 'read', key: 'new_submission' },
        action: { app: 'partner', type: 'write', key: 'direct_message' }
      },
      {
        id: 'slack_payment_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'new_payment_request' },
        action: { app: 'partner', type: 'write', key: 'channel_message' }
      },
      {
        id: 'slack_compliance_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'compliance_status_changed' },
        action: { app: 'partner', type: 'write', key: 'channel_message' }
      },
      {
        id: 'slack_certificate_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'channel_message' }
      },
      {
        id: 'slack_member_enroll',
        trigger: { app: 'partner', type: 'read', key: 'team_join', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'teams',
    name: 'Microsoft Teams',
    zapierKey: 'MSTeamsCLIAPI',
    category: 'communication',
    color: '#5059C9',
    isPopular: false,
    isRecent: false,
    recipes: [
      {
        id: 'teams_completed_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'send_channel_message_from_user' }
      },
      {
        id: 'teams_submission_chat',
        trigger: { app: 'classroomio', type: 'read', key: 'new_submission' },
        action: { app: 'partner', type: 'write', key: 'send_chat_message' }
      },
      {
        id: 'teams_compliance_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'compliance_status_changed' },
        action: { app: 'partner', type: 'write', key: 'send_channel_message_from_user' }
      },
      {
        id: 'teams_session_channel',
        trigger: { app: 'classroomio', type: 'read', key: 'live_session_scheduled' },
        action: { app: 'partner', type: 'write', key: 'send_channel_message_from_user' }
      },
      {
        id: 'teams_member_enroll',
        trigger: { app: 'partner', type: 'read', key: 'member', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'google_meet',
    name: 'Google Meet',
    zapierKey: 'GoogleMeetCLIAPI',
    category: 'communication',
    color: '#00AC47',
    monogram: 'GM',
    isPopular: false,
    isRecent: true,
    recipes: [
      {
        id: 'meet_session_meeting',
        trigger: { app: 'classroomio', type: 'read', key: 'live_session_scheduled' },
        action: { app: 'partner', type: 'write', key: 'schedule_meeting' }
      },
      {
        id: 'meet_completed_meeting',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'schedule_meeting' }
      }
    ]
  },
  {
    slug: 'zoom',
    name: 'Zoom',
    zapierKey: 'ZoomCLIAPI',
    category: 'communication',
    color: '#2D8CFF',
    isPopular: true,
    isRecent: true,
    recipes: [
      {
        id: 'zoom_enrollment_registrant',
        trigger: { app: 'classroomio', type: 'read', key: 'new_course_enrollment' },
        action: { app: 'partner', type: 'write', key: 'create_registrant' }
      },
      {
        id: 'zoom_cohort_registrant',
        trigger: { app: 'classroomio', type: 'read', key: 'new_cohort_member' },
        action: { app: 'partner', type: 'write', key: 'create_meeting_registrant' }
      },
      {
        id: 'zoom_session_meeting',
        trigger: { app: 'classroomio', type: 'read', key: 'live_session_scheduled' },
        action: { app: 'partner', type: 'write', key: 'create_meeting' }
      },
      {
        id: 'zoom_registrant_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_registrant', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'zoom_joiner_lesson',
        trigger: { app: 'partner', type: 'read', key: 'new_joiner', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'mark_lesson_complete' }
      }
    ]
  },
  {
    slug: 'zendesk',
    name: 'Zendesk',
    zapierKey: 'ZendeskV2CLIAPI',
    category: 'customer-support',
    color: '#03363D',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'zendesk_tag_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_tag_ticket', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'zendesk_compliance_ticket',
        trigger: { app: 'classroomio', type: 'read', key: 'compliance_status_changed' },
        action: { app: 'partner', type: 'write', key: 'ticket' }
      },
      {
        id: 'zendesk_payment_ticket',
        trigger: { app: 'classroomio', type: 'read', key: 'new_payment_request' },
        action: { app: 'partner', type: 'write', key: 'ticket' }
      },
      {
        id: 'zendesk_completed_user',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'update_user' }
      },
      {
        id: 'zendesk_user_enroll',
        trigger: { app: 'partner', type: 'read', key: 'user_v2', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'intercom',
    name: 'Intercom',
    zapierKey: 'IntercomV2CLIAPI',
    category: 'customer-support',
    color: '#1F8DED',
    isPopular: true,
    isRecent: true,
    recipes: [
      {
        id: 'intercom_completed_message',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'send_message_to_contact' }
      },
      {
        id: 'intercom_completed_tag',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'add_tag_to_contact' }
      },
      {
        id: 'intercom_lesson_event',
        trigger: { app: 'classroomio', type: 'read', key: 'lesson_completed' },
        action: { app: 'partner', type: 'write', key: 'create_data_event' }
      },
      {
        id: 'intercom_user_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_user_created', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'intercom_tag_enroll',
        trigger: { app: 'partner', type: 'read', key: 'user_tag', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'calendly',
    name: 'Calendly',
    zapierKey: 'CalendlyCLIAPI',
    category: 'sales',
    color: '#006BFF',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'calendly_booking_enroll',
        trigger: { app: 'partner', type: 'read', key: 'invitee_created', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'calendly_noshow_invite',
        trigger: { app: 'partner', type: 'read', key: 'invitee_no_show_created', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'send_course_invite' }
      },
      {
        id: 'calendly_form_student',
        trigger: { app: 'partner', type: 'read', key: 'routing_form_submission', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'add_student' }
      },
      {
        id: 'calendly_cancel_remove',
        trigger: { app: 'partner', type: 'read', key: 'invitee_canceled', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'remove_course_member' }
      }
    ]
  },
  {
    slug: 'calcom',
    name: 'Cal.com',
    zapierKey: 'CalComCLIAPI',
    category: 'sales',
    color: '#000000',
    isPopular: false,
    isRecent: true,
    recipes: [
      {
        id: 'calcom_booking_enroll',
        trigger: { app: 'partner', type: 'read', key: 'booking_created', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'calcom_cancel_remove',
        trigger: { app: 'partner', type: 'read', key: 'booking_cancelled', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'remove_course_member' }
      },
      {
        id: 'calcom_meeting_invite',
        trigger: { app: 'partner', type: 'read', key: 'meeting_ended', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'send_course_invite' }
      }
    ]
  },
  {
    slug: 'sheets',
    name: 'Google Sheets',
    zapierKey: 'GoogleSheetsV2CLIAPI',
    category: 'productivity',
    color: '#188038',
    monogram: 'GS',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'sheets_completed_row',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'add_row' }
      },
      {
        id: 'sheets_certificate_row',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'add_row' }
      },
      {
        id: 'sheets_compliance_row',
        trigger: { app: 'classroomio', type: 'read', key: 'compliance_status_changed' },
        action: { app: 'partner', type: 'write', key: 'add_row' }
      },
      {
        id: 'sheets_payment_row',
        trigger: { app: 'classroomio', type: 'read', key: 'new_payment_request' },
        action: { app: 'partner', type: 'write', key: 'add_row' }
      },
      {
        id: 'sheets_row_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_row_notify_hook', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'sheets_row_cohort',
        trigger: { app: 'partner', type: 'read', key: 'new_row_notify_hook', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'add_cohort_member' }
      }
    ]
  },
  {
    slug: 'notion',
    name: 'Notion',
    zapierKey: 'NotionCLIAPI',
    category: 'productivity',
    color: '#1A1A1A',
    isPopular: false,
    isRecent: true,
    recipes: [
      {
        id: 'notion_completed_item',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'create_database_item' }
      },
      {
        id: 'notion_submission_item',
        trigger: { app: 'classroomio', type: 'read', key: 'new_submission' },
        action: { app: 'partner', type: 'write', key: 'create_database_item' }
      },
      {
        id: 'notion_course_page',
        trigger: { app: 'classroomio', type: 'read', key: 'course_published' },
        action: { app: 'partner', type: 'write', key: 'create_page' }
      },
      {
        id: 'notion_item_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_data_source_item', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      }
    ]
  },
  {
    slug: 'confluence',
    name: 'Confluence',
    zapierKey: 'ConfluenceCloudCLIAPI',
    category: 'productivity',
    color: '#2684FF',
    isPopular: false,
    isRecent: true,
    recipes: [
      {
        id: 'confluence_course_page',
        trigger: { app: 'classroomio', type: 'read', key: 'course_published' },
        action: { app: 'partner', type: 'write', key: 'pageCreate' }
      },
      {
        id: 'confluence_session_page',
        trigger: { app: 'classroomio', type: 'read', key: 'live_session_scheduled' },
        action: { app: 'partner', type: 'write', key: 'pageCreate' }
      },
      {
        id: 'confluence_page_announce',
        trigger: { app: 'partner', type: 'read', key: 'pageList', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'post_cohort_announcement' }
      }
    ]
  },
  {
    slug: 'typeform',
    name: 'Typeform',
    zapierKey: 'TypeformCLIAPI',
    category: 'forms',
    color: '#262627',
    isPopular: true,
    isRecent: false,
    recipes: [
      {
        id: 'typeform_entry_enroll',
        trigger: { app: 'partner', type: 'read', key: 'entries_resthook_v2', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'typeform_entry_cohort',
        trigger: { app: 'partner', type: 'read', key: 'entries_resthook_v2', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'add_cohort_member' }
      },
      {
        id: 'typeform_entry_student',
        trigger: { app: 'partner', type: 'read', key: 'entries_resthook_v2', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'add_student' }
      }
    ]
  },
  {
    slug: 'jotform',
    name: 'Jotform',
    zapierKey: 'JotFormCLIAPI',
    category: 'forms',
    color: '#FF6100',
    isPopular: false,
    isRecent: false,
    recipes: [
      {
        id: 'jotform_submission_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_submission', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'jotform_completed_form',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'assign_prefilled_form' }
      },
      {
        id: 'jotform_submission_student',
        trigger: { app: 'partner', type: 'read', key: 'new_submission', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'add_student' }
      }
    ]
  },
  {
    slug: 'pendo',
    name: 'Pendo',
    zapierKey: 'ReceptiveCLIAPI',
    category: 'analytics',
    color: '#00A99D',
    isPopular: false,
    isRecent: true,
    recipes: [
      {
        id: 'pendo_status_enroll',
        trigger: { app: 'partner', type: 'read', key: 'feature_status_changed', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'pendo_status_announce',
        trigger: { app: 'partner', type: 'read', key: 'feature_status_changed', isInstant: true },
        action: { app: 'classroomio', type: 'write', key: 'post_cohort_announcement' }
      }
    ]
  },
  {
    slug: 'mixpanel',
    name: 'Mixpanel',
    zapierKey: 'MixpanelCLIAPI',
    category: 'analytics',
    color: '#7856FF',
    isPopular: false,
    isRecent: false,
    recipes: [
      {
        id: 'mixpanel_completed_event',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'track' }
      },
      {
        id: 'mixpanel_enrollment_event',
        trigger: { app: 'classroomio', type: 'read', key: 'new_course_enrollment' },
        action: { app: 'partner', type: 'write', key: 'track' }
      },
      {
        id: 'mixpanel_lesson_event',
        trigger: { app: 'classroomio', type: 'read', key: 'lesson_completed' },
        action: { app: 'partner', type: 'write', key: 'track' }
      },
      {
        id: 'mixpanel_certificate_profile',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'engage' }
      }
    ]
  },
  {
    slug: 'circle',
    name: 'Circle',
    zapierKey: 'CircleCLIAPI',
    category: 'community',
    color: '#5B4FE9',
    isPopular: false,
    isRecent: true,
    recipes: [
      {
        id: 'circle_member_enroll',
        trigger: { app: 'partner', type: 'read', key: 'new_member', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'enroll_student' }
      },
      {
        id: 'circle_certificate_space',
        trigger: { app: 'classroomio', type: 'read', key: 'new_certificate' },
        action: { app: 'partner', type: 'write', key: 'add_space_member' }
      },
      {
        id: 'circle_completed_tag',
        trigger: { app: 'classroomio', type: 'read', key: 'course_completed' },
        action: { app: 'partner', type: 'write', key: 'tag_members' }
      },
      {
        id: 'circle_cohort_group',
        trigger: { app: 'classroomio', type: 'read', key: 'new_cohort_member' },
        action: { app: 'partner', type: 'write', key: 'add_space_group_member' }
      },
      {
        id: 'circle_removed_student',
        trigger: { app: 'partner', type: 'read', key: 'community_member_removed', isInstant: false },
        action: { app: 'classroomio', type: 'write', key: 'remove_student' }
      }
    ]
  }
] as const satisfies readonly TZapierPartnerApp[];

export function getZapierPartnerApp(slug: string): TZapierPartnerApp | null {
  return ZAPIER_PARTNER_APPS.find((app) => app.slug === slug) ?? null;
}
