import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAssignAudienceCourses,
  ZPublicApiAudienceMemberParam,
  ZPublicApiAudienceQuery,
  ZPublicApiCreateAudience,
  ZPublicApiCreateTeamInviteLink,
  ZPublicApiInviteTeamMembers,
  ZPublicApiInviteTeamMembersResponse,
  ZPublicApiRemoveTeamMemberResponse,
  ZPublicApiTeamInviteLinkQuery,
  ZPublicApiTeamInviteLinkResponse,
  ZPublicApiTeamMemberParam,
  ZPublicApiTeamMemberResponse,
  ZPublicApiTeamQuery,
  ZPublicApiUpdateAudience,
  ZPublicApiUpdateTeamInviteLink,
  ZPublicApiUpdateTeamMember
} from '../src/validation/public-api';
import { AUDIENCE_IMPORT_MAX_ROWS } from '../src/validation/organization/audience-import';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiTeamQuery,
  ZPublicApiTeamMemberParam,
  ZPublicApiUpdateTeamMember,
  ZPublicApiInviteTeamMembers,
  ZPublicApiTeamInviteLinkQuery,
  ZPublicApiCreateTeamInviteLink,
  ZPublicApiUpdateTeamInviteLink,
  ZPublicApiAudienceQuery,
  ZPublicApiAudienceMemberParam,
  ZPublicApiCreateAudience,
  ZPublicApiAssignAudienceCourses,
  ZPublicApiUpdateAudience
};

describe('public API team and audience update contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it.each(
    Object.entries({
      ZPublicApiInviteTeamMembersResponse,
      ZPublicApiRemoveTeamMemberResponse,
      ZPublicApiTeamInviteLinkResponse
    })
  )('%s keeps its published response shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('only accepts the admin and tutor roles for invites and invite links', () => {
    expect(ZPublicApiInviteTeamMembers.safeParse({ emails: ['a@example.com'], roleId: 3 }).success).toBe(false);
    expect(ZPublicApiInviteTeamMembers.parse({ emails: ['a@example.com'], roleId: 2 })).toEqual({
      emails: ['a@example.com'],
      roleId: 2,
      confirmedStudentEmails: []
    });
    expect(ZPublicApiTeamInviteLinkQuery.parse({ roleId: '1' })).toEqual({ roleId: 1 });
    expect(ZPublicApiTeamInviteLinkQuery.safeParse({ roleId: '3' }).success).toBe(false);
    expect(ZPublicApiUpdateTeamInviteLink.safeParse({ roleId: 1 }).success).toBe(false);
    expect(ZPublicApiUpdateTeamInviteLink.safeParse({ roleId: 1, enabled: true }).success).toBe(true);
  });

  it('ZPublicApiTeamMemberResponse keeps its published shape', () => {
    expect(z.toJSONSchema(ZPublicApiTeamMemberResponse, { io: 'output', unrepresentable: 'any' })).toMatchSnapshot();
  });

  it('only lets a team member be made an admin or a tutor', () => {
    expect(ZPublicApiUpdateTeamMember.safeParse({ roleId: 1 }).success).toBe(true);
    expect(ZPublicApiUpdateTeamMember.safeParse({ roleId: 2 }).success).toBe(true);
    expect(ZPublicApiUpdateTeamMember.safeParse({ roleId: 3 }).success).toBe(false);
    expect(ZPublicApiUpdateTeamMember.safeParse({ roleId: 0 }).success).toBe(false);
  });

  it('rejects an update with nothing to change', () => {
    expect(ZPublicApiUpdateTeamMember.safeParse({}).success).toBe(false);
    expect(ZPublicApiUpdateAudience.safeParse({}).success).toBe(false);
    expect(ZPublicApiUpdateAudience.safeParse({ sendEmail: false }).success).toBe(false);
  });

  it('keeps the name rules', () => {
    expect(ZPublicApiUpdateAudience.safeParse({ name: 'Al' }).success).toBe(false);
    expect(ZPublicApiUpdateAudience.safeParse({ name: '   Al   ' }).success).toBe(false);
    expect(ZPublicApiUpdateAudience.safeParse({ name: 'x'.repeat(121) }).success).toBe(false);
    expect(ZPublicApiUpdateTeamMember.parse({ name: '  Ada Lovelace  ' })).toEqual({ name: 'Ada Lovelace' });
  });

  it('still accepts the email-only body the endpoint took before', () => {
    expect(ZPublicApiUpdateAudience.parse({ email: 'a@example.com' })).toEqual({
      email: 'a@example.com',
      sendEmail: true
    });
  });

  it('invites one person by email, as before', () => {
    expect(ZPublicApiCreateAudience.parse({ email: 'a@example.com' })).toEqual({
      email: 'a@example.com',
      sendEmail: true
    });
    expect(ZPublicApiCreateAudience.safeParse({ email: 'broken' }).success).toBe(false);
  });

  it('trims the single email the same way as the list', () => {
    expect(ZPublicApiCreateAudience.parse({ email: ' a@example.com ' }).email).toBe('a@example.com');
  });

  it('invites a list, leaving bad addresses for the per-row result', () => {
    expect(ZPublicApiCreateAudience.parse({ emails: [' a@example.com ', 'broken'] })).toEqual({
      emails: ['a@example.com', 'broken'],
      sendEmail: true
    });
  });

  it('leaves an overlong address for the per-row result instead of failing the request', () => {
    expect(
      ZPublicApiCreateAudience.safeParse({ emails: ['a@example.com', `${'x'.repeat(400)}@example.com`] }).success
    ).toBe(true);
  });

  it('takes email or emails, not both and not neither', () => {
    expect(ZPublicApiCreateAudience.safeParse({}).success).toBe(false);
    expect(ZPublicApiCreateAudience.safeParse({ email: 'a@example.com', emails: ['b@example.com'] }).success).toBe(
      false
    );
    expect(ZPublicApiCreateAudience.safeParse({ emails: [] }).success).toBe(false);
  });

  it('caps a list at the dashboard import limit', () => {
    const emails = (count: number) => Array.from({ length: count }, (_, i) => `p${i}@example.com`);

    expect(ZPublicApiCreateAudience.safeParse({ emails: emails(AUDIENCE_IMPORT_MAX_ROWS) }).success).toBe(true);
    expect(ZPublicApiCreateAudience.safeParse({ emails: emails(AUDIENCE_IMPORT_MAX_ROWS + 1) }).success).toBe(false);
  });

  it('rejects email and name together, since they apply to different kinds of member', () => {
    expect(ZPublicApiUpdateAudience.safeParse({ email: 'a@example.com', name: 'Ada Lovelace' }).success).toBe(false);
  });

  it('leaves no way to change the fields that belong to the person', () => {
    const parsed = ZPublicApiUpdateTeamMember.parse({
      name: 'Ada Lovelace',
      email: 'new@example.com',
      password: 'secret',
      username: 'ada',
      avatarUrl: 'https://example.com/a.png'
    });

    expect(parsed).toEqual({ name: 'Ada Lovelace' });
  });
});
