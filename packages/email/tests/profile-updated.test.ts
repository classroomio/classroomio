import { describe, expect, it } from 'vitest';
import { EMAIL_LOCALES } from '@cio/utils/email';

import { profileUpdatedEmail } from '../src/emails/profile-updated';

const baseFields = {
  name: 'Sam Student',
  changedFields: ['fullname', 'avatarUrl'] as ('fullname' | 'username' | 'avatarUrl' | 'locale')[],
  changedBy: 'admin' as const,
  orgName: 'Academy',
  changedAt: '2026-10-31T09:30:00.000Z',
  locale: 'en' as const,
  loginUrl: 'https://academy.example.com',
  branding: {}
};

const { render, subject, schema } = profileUpdatedEmail.template;

describe('profileUpdatedEmail', () => {
  it('lists what changed, when, and that an admin of the organization did it', () => {
    const rendered = render(baseFields);

    expect(rendered).toContain('Hi Sam Student,');
    expect(rendered).toContain('An admin of Academy updated your profile.');
    expect(rendered).toContain('Name, Profile picture');
    expect(rendered).toContain('October 31, 2026');
    expect(rendered).toContain('UTC');
    expect(rendered).toContain('href="https://academy.example.com"');
    expect(rendered).toContain('Sign in');
  });

  it('says the person made the change themselves', () => {
    const rendered = render({ ...baseFields, changedBy: 'self' });

    expect(rendered).toContain('You updated your profile.');
    expect(rendered).not.toContain('An admin of');
  });

  it('writes in the requested language, subject included', () => {
    const fields = { ...baseFields, locale: 'fr' as const, changedFields: ['username' as const] };
    const rendered = render(fields);

    expect(typeof subject === 'function' && subject(fields)).toBe('Votre profil a été mis à jour');
    expect(rendered).toContain('Un administrateur de Academy a mis à jour votre profil.');
    expect(rendered).toContain('Nom d&#39;utilisateur');
    expect(rendered).toContain('lang="fr"');
  });

  it.each(EMAIL_LOCALES)('renders in %s', (locale) => {
    expect(() => render({ ...baseFields, locale })).not.toThrow();
  });

  it('escapes the name and organization', () => {
    const rendered = render({ ...baseFields, name: '<b>Sam</b>', orgName: '<script>x</script>' });

    expect(rendered).not.toContain('<b>Sam</b>');
    expect(rendered).not.toContain('<script>x</script>');
  });

  it('refuses a send with nothing changed or an unknown field', () => {
    expect(schema.safeParse({ ...baseFields, changedFields: [] }).success).toBe(false);
    expect(schema.safeParse({ ...baseFields, changedFields: ['email'] }).success).toBe(false);
  });
});
