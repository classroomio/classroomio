import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiEmailTemplateParam,
  ZPublicApiEmailTemplateQuery,
  ZPublicApiEmailTemplateResponse,
  ZPublicApiEmailTemplateSummaryResponse,
  ZPublicApiEmailTemplateTestResponse,
  ZPublicApiSaveEmailTemplate,
  ZPublicApiSendTestEmailTemplate
} from '../src/validation/public-api';
import {
  ZStudentEmailTemplateParams,
  ZTestStudentEmailTemplate,
  ZUpsertStudentEmailTemplate
} from '../src/validation/organization';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiEmailTemplateQuery,
  ZPublicApiEmailTemplateParam,
  ZPublicApiSaveEmailTemplate,
  ZPublicApiSendTestEmailTemplate
};

const responseSchemas = {
  ZPublicApiEmailTemplateSummaryResponse,
  ZPublicApiEmailTemplateResponse,
  ZPublicApiEmailTemplateTestResponse
};

describe('public API organization email template contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it.each(Object.entries(responseSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it.each([
    { emailId: 'studentCourseWelcome', locale: 'fr' },
    { emailId: 'newsfeedPost', locale: 'it' },
    { emailId: 'unknown', locale: 'fr' },
    { emailId: 'studentCourseWelcome', locale: 'xx' }
  ])('accepts the same template params as the dashboard: %j', (params) => {
    expect(ZPublicApiEmailTemplateParam.safeParse(params).success).toBe(
      ZStudentEmailTemplateParams.safeParse(params).success
    );
  });

  it.each([
    { content: '<p>x</p>' },
    { content: '<p>x</p>', subject: null },
    { content: '<p>x</p>', subject: 'Hi' },
    { content: '' },
    { content: 'x'.repeat(50_001) },
    { content: '<p>x</p>', subject: '' },
    { content: '<p>x</p>', subject: 'x'.repeat(201) }
  ])('saves with the same rules as the dashboard: %j', (body) => {
    expect(ZPublicApiSaveEmailTemplate.safeParse(body).success).toBe(
      ZUpsertStudentEmailTemplate.safeParse(body).success
    );
  });

  it.each([
    { recipientEmails: ['a@example.com'] },
    { recipientEmails: [] },
    { recipientEmails: ['not-an-email'] },
    { recipientEmails: Array.from({ length: 6 }, (_, i) => `a${i}@example.com`) }
  ])('checks test recipients with the same rules as the dashboard: %j', ({ recipientEmails }) => {
    const draft = { content: '<p>x</p>', subject: 'Hi', recipientEmails };

    expect(ZPublicApiSendTestEmailTemplate.safeParse(draft).success).toBe(
      ZTestStudentEmailTemplate.safeParse(draft).success
    );
  });

  it('lets a test send leave out the draft, unlike the dashboard', () => {
    expect(ZPublicApiSendTestEmailTemplate.safeParse({ recipientEmails: ['a@example.com'] }).success).toBe(true);
  });

  it('lists English templates by default', () => {
    expect(ZPublicApiEmailTemplateQuery.parse({})).toEqual({ page: 1, limit: 20, locale: 'en' });
  });
});
