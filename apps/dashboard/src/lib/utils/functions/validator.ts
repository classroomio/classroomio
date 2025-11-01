import z from 'zod';
import { get } from 'svelte/store';
import isNumber from 'lodash/isNumber';
import { validateEmail } from './validateEmail';
import { t as _t, initialized } from '$lib/utils/functions/translations';

const t = {
  get: (key: string, fallback?: string) => {
    const isInitialized = get(initialized);
    if (!isInitialized) return fallback ?? key;

    return _t.get(key);
  }
};

const getOrgNameValidation = () =>
  z
    .string()
    .min(5, {
      message: t.get(
        'validations.organization_name.min_char',
        'Organization name must be at least 5 characters long'
      )
    })
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: t.get(
        'validations.organization_name.hyphen_rule',
        "Organization name can't start or end with a hyphen"
      )
    });

const getSiteNameValidation = () =>
  z
    .string()
    .min(5, {
      message: t.get(
        'validations.site_name.min_char',
        'Site name must be at least 5 characters long'
      )
    })
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: t.get(
        'validations.site_name.hyphen_rule',
        "Site name can't start or end with a hyphen"
      )
    });

const getNewsfeedValidation = () =>
  z.string().min(5, { message: `${t.get('validations.news_feed.min_char')}` });

const lessonSchema = z.object({
  title: z.string().nonempty({ message: `${t.get('validations.lesson_schema.empty_title')}` }),
  lesson_at: z.string().optional(),
  call_url: z.string().nullable().optional(),
  is_unlocked: z.boolean().optional()
});

const createQuizValidationSchema = z.object({
  title: z.string().min(6, {
    message: `${t.get('validations.course_payment.full_name.min_char')}`
  })
});

const askCommunityValidationSchema = z.object({
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
const commentInCommunityValidationSchema = z.object({
  comment: z.string().min(6, {
    message: `${t.get('validations.comment_in_community.min_char')}`
  })
});

const orgLandingpageValidationSchema = z.object({
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

const forgotValidationSchema = z.object({
  email: z.string().email({
    message: `${t.get('validations.forgot.invalid_email')}`
  })
});

const authValidationSchema = z.object({
  email: z.string().email({
    message: 'validations.auth.email.invalid_email'
  }),
  password: z.string().min(6, {
    message: 'validations.auth.password.min_char'
  })
});

const resetValidationSchema = z.object({
  password: z.string().min(6, {
    message: `${t.get('validations.reset.password.min_char')}`
  })
});

const onboardingValidationSchema = {
  stepOne: z.object({
    fullname: z.string().min(5, {
      message: t.get(
        'validations.onboarding.step_one.full_name.min_char',
        'Full name must be at least 5 characters long'
      )
    }),
    orgName: getOrgNameValidation(),
    siteName: getSiteNameValidation()
  }),
  stepTwo: z.object({
    goal: z
      .string({
        required_error: t.get(
          'validations.onboarding.step_two.goal.required',
          'Please select your goal'
        )
      })
      .min(1, {
        message: t.get('validations.onboarding.step_two.goal.min', 'Please select your goal')
      }),
    source: z
      .string({
        required_error: t.get(
          'validations.onboarding.step_two.source.required',
          'Please select where you heard about Classroomio'
        )
      })
      .min(1, {
        message: t.get(
          'validations.onboarding.step_two.source.min',
          'Please select where you heard about Classroomio'
        )
      })
  })
};

const saveCertificateSchema = z.object({
  description: z.string().max(200, 'course.navItem.certificates.description_error'),
  is_certificate_downloadable: z.boolean(),
  certificate_theme: z.string()
});

export const saveCertificateValidation = (fields = {}) => {
  const { error } = saveCertificateSchema.safeParse(fields);
  return processErrors(error);
};

const updateProfileValidationSchema = z.object({
  email: z.string().email({ message: 'validations.user_profile.email' }),
  username: z.string().nonempty({ message: 'validations.user_profile.username' }),
  fullname: z.string().min(5, { message: 'validations.user_profile.fullname' })
});

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
        path.forEach((p, i) => {
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
  const { error } = authValidationSchema.safeParse(fields);
  return processErrors(error);
};

export const lessonValidation = (lesson = {}) => {
  const { error } = lessonSchema.safeParse(lesson);
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

export const resetValidation = (fields = {}) => {
  const { error } = resetValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const forgotValidation = (fields = {}) => {
  const { error } = forgotValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const orgLandingpageValidation = (fields = {}) => {
  const { error } = orgLandingpageValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const onboardingValidation = (fields = {}, step) => {
  const schema =
    step === 1 ? onboardingValidationSchema.stepOne : onboardingValidationSchema.stepTwo;
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const updateProfileValidation = (fields = {}) => {
  const schema = updateProfileValidationSchema;
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

// export const createTemplateExerciseValidation = (fields = {}) => {
//   const schema = z.object({
//     orgName: z.string().min(5, {
//       message: 'Must be 5 or more characters long',
//     }),
//     siteName: z.string().min(5, {
//       message: 'Must be 5 or more characters long',
//     })
//   });
//   const { error } = schema.safeParse(fields);

//   return processErrors(error);
// };

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
  const { error } = createQuizValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const askCommunityValidation = (fields = {}) => {
  const { error } = askCommunityValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const commentInCommunityValidation = (fields = {}) => {
  const { error } = commentInCommunityValidationSchema.safeParse(fields);

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
