export const CLIENT_EVENTS = {
  LANDING_VIEW: 'landing_view',
  COURSE_PAGE_VIEW: 'course_page_view',
  NOTE_PAGE_VIEW: 'doc_page_view',
  SIGNUP_VIEW: 'signup_view',
  SIGNIN_VIEW: 'signin_view',
  PRICING_VIEW: 'pricing_view',
  CTA_CLICK: 'cta_click'
} as const;

export const SERVER_EVENTS = {
  ENROLLMENT_STARTED: 'enrollment_started',
  ENROLLMENT_COMPLETED: 'enrollment_completed',
  COURSE_COMPLETED: 'course_completed',
  CERTIFICATE_ISSUED: 'certificate_issued'
} as const;

export const ANALYTICS_EVENTS = {
  ...CLIENT_EVENTS,
  ...SERVER_EVENTS
} as const;

export type ClientEventType = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];
export type ServerEventType = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type AnalyticsEventType = ClientEventType | ServerEventType;

export const CLIENT_EVENT_TYPES = Object.values(CLIENT_EVENTS);
export const SERVER_EVENT_TYPES = Object.values(SERVER_EVENTS);
export const ALL_EVENT_TYPES = [...CLIENT_EVENT_TYPES, ...SERVER_EVENT_TYPES] as const;
