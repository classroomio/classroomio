import {
  EMAIL_LOCALES,
  STUDENT_EMAIL_CATALOG,
  STUDENT_EMAIL_IDS,
  containsStudentEmailActionLink,
  getUnknownStudentEmailVariables,
  isStudentEmailTemplateCustomized,
  resolveStudentEmailLocale
} from '../src/email';
import { describe, expect, it } from 'vitest';

function placeholders(value: string): string[] {
  return [...value.matchAll(/{{([a-z_]+)}}/g)].map((match) => match[1]).sort();
}

describe('student email catalog', () => {
  it('keeps every locale aligned with the English placeholders', () => {
    for (const emailId of STUDENT_EMAIL_IDS) {
      const englishCopy = STUDENT_EMAIL_CATALOG.en.templates[emailId];
      const expected = {
        subject: placeholders(englishCopy.subject),
        body: placeholders(englishCopy.body)
      };

      for (const locale of EMAIL_LOCALES) {
        const localizedCopy = STUDENT_EMAIL_CATALOG[locale].templates[emailId];
        expect({ subject: placeholders(localizedCopy.subject), body: placeholders(localizedCopy.body) }).toEqual(
          expected
        );
      }
    }
  });

  it('uses English for unpaid plans and unenforced organization languages', () => {
    expect(resolveStudentEmailLocale({ isEligible: false, enforced: true, locale: 'fr' })).toBe('en');
    expect(resolveStudentEmailLocale({ isEligible: true, enforced: false, locale: 'fr' })).toBe('en');
  });

  it('uses the enforced locale for paid and self-hosted organizations', () => {
    expect(resolveStudentEmailLocale({ isEligible: true, enforced: true, locale: 'fr' })).toBe('fr');
  });

  it('falls back to English for unsupported locales', () => {
    expect(resolveStudentEmailLocale({ isEligible: true, enforced: true, locale: 'xx' })).toBe('en');
  });

  it('does not call editor-normalized default bodies customized', () => {
    expect(
      isStudentEmailTemplateCustomized({
        emailId: 'sessionReminder',
        locale: 'en',
        content: STUDENT_EMAIL_CATALOG.en.templates.sessionReminder.body
      })
    ).toBe(false);
    expect(
      isStudentEmailTemplateCustomized({
        emailId: 'newsfeedPost',
        locale: 'en',
        content: STUDENT_EMAIL_CATALOG.en.templates.newsfeedPost.body.replace(
          '{{post_content}}',
          '<p>{{post_content}}</p>'
        )
      })
    ).toBe(false);
    expect(
      isStudentEmailTemplateCustomized({
        emailId: 'studentCourseCompletion',
        locale: 'en',
        content: STUDENT_EMAIL_CATALOG.en.templates.studentCourseCompletion.body.replace(
          '{{course_message}}',
          '<p>{{course_message}}</p><p></p>'
        )
      })
    ).toBe(false);
  });

  it('marks changed subjects or body copy as customized', () => {
    expect(
      isStudentEmailTemplateCustomized({
        emailId: 'sessionReminder',
        locale: 'en',
        content: STUDENT_EMAIL_CATALOG.en.templates.sessionReminder.body.replace('See you there', 'See you soon')
      })
    ).toBe(true);
    expect(
      isStudentEmailTemplateCustomized({
        emailId: 'sessionReminder',
        locale: 'en',
        content: STUDENT_EMAIL_CATALOG.en.templates.sessionReminder.body,
        subject: 'Your live session starts soon'
      })
    ).toBe(true);
  });

  it('rejects unknown placeholders and recognizes action-link sentinels', () => {
    expect(getUnknownStudentEmailVariables('sessionReminder', '<p>{{session_title}} {{session_titel}}</p>')).toEqual([
      'session_titel'
    ]);
    expect(getUnknownStudentEmailVariables('sessionReminder', '<p>{{session-title}}</p>')).toEqual(['session-title']);
    expect(getUnknownStudentEmailVariables('newsfeedPost', '<a href="{{action_url}}">Read post</a>')).toEqual([]);
    expect(getUnknownStudentEmailVariables('newsfeedPost', '<p>{{action_url}}</p>')).toEqual(['action_url']);
    expect(containsStudentEmailActionLink("<a href = '{{action_url}}'>Open</a>")).toBe(true);
    expect(containsStudentEmailActionLink('<a href="https://example.com">Open</a>')).toBe(false);
  });
});
