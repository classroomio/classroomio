import isNumber from 'lodash/isNumber';
import { t } from '$lib/utils/functions/translations';
import { validateEmail } from './validateEmail';
import z from 'zod';

function getOrgNameValidation() {
  return z
    .string()
    .min(5, { message: `${t.get('validations.organization_name.min_char')}` })
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: `${t.get('validations.organization_name.hyphen_rule')}`
    });
}

function getSiteNameValidation() {
  return z
    .string()
    .min(5, { message: `${t.get('validations.site_name.min_char')}` })
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: `${t.get('validations.site_name.hyphen_rule')}`
    });
}
function getNewsfeedValidation() {
  return z.string().min(5, { message: `${t.get('validations.news_feed.min_char')}` });
}

export const saveCertificateValidation = (fields = {}) => {
  const schema = z.object({
    description: z.string().max(200, 'course.navItem.certificates.description_error'),
    is_certificate_downloadable: z.boolean(),
    certificate_theme: z.string()
  });

  const { error } = schema.safeParse(fields);
  return processErrors(error);
};

export const getConfirmPasswordError = ({ password, confirmPassword }) => {
  return password > 6 && confirmPassword > 6 && password !== confirmPassword
    ? `${t.get('validations.confirm_password.not_match')}`
    : undefined;
};

export const processErrors = (error, mapToId?: boolean) => {
  const errors: Record<string, string> = {};

  if (Array.isArray(error?.issues)) {
    for (const issue of error.issues) {
      const { message, path } = issue;

      if (!path.length) {
        continue;
      }

      if (mapToId) {
        let value = '';
        path.forEach((p) => {
          const formatP = isNumber(p) ? `[${p}]` : p;

          value += !value ? formatP : `.${formatP}`;
        });
        const key = value.replace('label', 'id');
        errors[key] = value;
      } else {
        errors[path[0]] = message;
      }
    }
  }

  return errors;
};

export const authValidation = (fields = {}) => {
  const schema = z.object({
    email: z.string().email({
      message: 'validations.auth.email.invalid_email'
    }),
    password: z.string().min(6, {
      message: 'validations.auth.password.min_char'
    })
  });

  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const lessonValidation = (lesson = {}) => {
  const schema = z.object({
    title: z.string().nonempty({ message: `${t.get('validations.lesson_schema.empty_title')}` }),
    lesson_at: z.string().optional(),
    call_url: z.string().nullable().optional(),
    is_unlocked: z.boolean().optional()
  });

  const { error } = schema.safeParse(lesson);

  return processErrors(error);
};

export const coursePaymentValidation = (fields = {}) => {
  const schema = z.object({
    fullname: z.string().min(6, {
      message: `${t.get('validations.course_payment.full_name.min_char')}`
    }),
    email: z.string().email({
      message: `${t.get('validations.course_payment.email.invalid_email')}`
    })
  });
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const orgLandingpageValidation = (fields = {}) => {
  const schema = z.object({
    name: z.string().min(6, {
      message: `${t.get('validations.org_landing_page.name.min_char')}`
    }),
    email: z.string().email({
      message: `${t.get('validations.org_landing_page.email.invalid_email')}`
    }),
    phone: z.string().min(6, {
      message: `${t.get('validations.org_landing_page.phone.min_char')}`
    }),
    message: z.string().min(20, {
      message: `${t.get('validations.org_landing_page.message.min_char')}`
    })
  });
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const createNewsfeedValidation = (newPost) => {
  const schema = z.object({
    newPost: getNewsfeedValidation()
  });
  const { error } = schema.safeParse({ newPost });

  return processErrors(error);
};

export const addNewsfeedCommentValidation = (newComment) => {
  const schema = z.object({
    newComment: getNewsfeedValidation()
  });
  const { error } = schema.safeParse({ newComment });

  return processErrors(error);
};

export const createOrgValidation = (fields = {}) => {
  const schema = z.object({
    orgName: getOrgNameValidation(),
    siteName: getSiteNameValidation()
  });
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const updateOrgNameValidation = (orgName) => {
  const schema = z.object({
    orgName: getOrgNameValidation()
  });
  const { error } = schema.safeParse({ orgName });

  return processErrors(error);
};
export const updateOrgSiteNameValidation = (siteName) => {
  const schema = z.object({
    siteName: getSiteNameValidation()
  });
  const { error } = schema.safeParse({ siteName });

  return processErrors(error);
};
export const updateProfileEmailValidation = (email) => {
  const schema = z.object({
    email: z.string().email({ message: `${t.get('validations.user_profile.email')}` })
  });
  const { error } = schema.safeParse({ email });

  return processErrors(error);
};

export const createQuizValidation = (fields = {}) => {
  const schema = z.object({
    title: z.string().min(6, {
      message: `${t.get('validations.course_payment.full_name.min_char')}`
    })
  });

  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const askCommunityValidation = (fields = {}) => {
  const schema = z.object({
    title: z.string().min(6, {
      message: `${t.get('validations.ask_community.title.min_char')}`
    }),
    body: z.string().min(20, {
      message: `${t.get('validations.ask_community.body.min_char')}`
    }),
    courseId: z.string().min(36, {
      message: `${t.get('validations.ask_community.course_id.select_course')}`
    })
  });

  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const commentInCommunityValidation = (fields = {}) => {
  const schema = z.object({
    comment: z.string().min(6, {
      message: `${t.get('validations.comment_in_community.min_char')}`
    })
  });
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const getDisableSubmit = ({ password, confirmPassword }) => {
  return !!(password && confirmPassword && password !== confirmPassword);
};

export const validateEmailInString = (emailsStr) => {
  let error = '';
  let hasError = false;

  if (!emailsStr) {
    return {
      hasError: true,
      error: 'Enter an email',
      emails: []
    };
  }

  const emails = emailsStr.split(',').map((_email) => {
    const email = _email.trim();

    if (!validateEmail(email)) {
      hasError = true;
      error += !error.length ? `${t.get('validations.email.not_valid')}: ${email}` : `, ${email}`;
    }

    return email;
  });

  return {
    hasError,
    error,
    emails
  };
};
