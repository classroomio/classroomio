import { ZAPIER_TRIGGERS, type TZapierTrigger, type TZapierTriggerKey } from '@cio/utils/constants/zapier';

import { attachCertificateFile } from '../hydrators';
import { createEventTrigger, type EventMatcher, type EventTriggerOptions } from '../lib/event-trigger';
import { cohortFilterField, courseFilterField, roleFilterField, sourceFilterField } from '../lib/fields';
import { readString, readStringList } from '../lib/records';

const matchesSource: EventMatcher = (data, inputData) => {
  const wanted = readStringList(inputData.source);
  const source = data.source as { method?: string } | undefined;

  return wanted.length === 0 || wanted.includes(source?.method ?? '');
};

const matchesRole: EventMatcher = (data, inputData) => {
  const wanted = readString(inputData.role);

  return !wanted || data.role === wanted;
};

const matchesCompletedLesson: EventMatcher = (data) => data.isComplete === true;

const TRIGGER_OPTIONS: Record<TZapierTriggerKey, Omit<EventTriggerOptions, 'trigger'>> = {
  new_course_enrollment: { inputFields: [courseFilterField, sourceFilterField], matches: matchesSource },
  course_member_removed: { inputFields: [courseFilterField] },
  course_completed: { inputFields: [courseFilterField] },
  new_certificate: { inputFields: [courseFilterField], transform: attachCertificateFile },
  new_submission: { inputFields: [courseFilterField] },
  submission_status_changed: { inputFields: [courseFilterField] },
  lesson_completed: { inputFields: [courseFilterField], matches: matchesCompletedLesson },
  course_invite_accepted: { inputFields: [courseFilterField] },
  new_payment_request: { inputFields: [courseFilterField] },
  new_organization_member: { inputFields: [roleFilterField], matches: matchesRole },
  compliance_status_changed: { inputFields: [courseFilterField] },
  course_published: {},
  live_session_scheduled: { inputFields: [courseFilterField] },
  new_cohort_member: { inputFields: [cohortFilterField] }
};

export const eventTriggers = ZAPIER_TRIGGERS.map((trigger: TZapierTrigger) =>
  createEventTrigger({ trigger, ...TRIGGER_OPTIONS[trigger.key as TZapierTriggerKey] })
);
