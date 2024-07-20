import isNumber from 'lodash/isNumber';
import z from 'zod';
import { validateEmail } from './validateEmail';
import { t } from '$lib/utils/functions/translations';

const getOrgNameValidation = () =>
  z
    .string()
    .min(5, { message: `${t.get('validations.organization_name.min_char')}` })
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: `${t.get('validations.organization_name.hyphen_rule')}`
    });

const getSiteNameValidation = () =>
  z
    .string()
    .min(5, { message: `${t.get('validations.site_name.min_char')}` })
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: `${t.get('validations.site_name.hyphen_rule')}`
    });

const getNewsfeedValidation = () =>
  z.string().min(5, { message: `${t.get('validations.news_feed.min_char')}` });

const lessonSchema = z.object({
  title: z.string().nonempty({ message: `${t.get('validations.lesson_schema.empty_title')}` }),
  lesson_at: z.string().optional(),
  call_url: z.string().nullable().optional(),
  is_unlocked: z.boolean()
});

const createQuizValidationSchema = z.object({
  title: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  })
});

const askCommunityValidationSchema = z.object({
  title: z.string().min(6, {
    message: `${t.get('validations.ask_community.title.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  }),
  body: z.string().min(20, {
    message: `${t.get('validations.ask_community.body.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  }),
  courseId: z.string().min(36, {
    message: `${t.get('validations.ask_community.course_id.select_course')}`,
    invalid_type_error: `${t.get('validations.ask_community.course_id.select_course')}`
  })
});
const commentInCommunityValidationSchema = z.object({
  comment: z.string().min(6, {
    message: `${t.get('validations.comment_in_community.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  })
});

const orgLandingpageValidationSchema = z.object({
  name: z.string().min(6, {
    message: `${t.get('validations.org_landing_page.name.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  }),
  email: z.string().email({
    message: `${t.get('validations.org_landing_page.email.invalid_email')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  }),
  phone: z.string().min(6, {
    message: `${t.get('validations.org_landing_page.phone.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  }),
  message: z.string().min(20, {
    message: `${t.get('validations.org_landing_page.message.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  })
});

const forgotValidationSchema = z.object({
  email: z.string().email({
    message: `${t.get('validations.forgot.invalid_email')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  })
});

const authValidationSchema = z.object({
  email: z.string().email({
    message: `${t.get('validations.auth.email.invalid_email')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  }),
  password: z.string().min(6, {
    message: `${t.get('validations.auth.password.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  })
});

const resetValidationSchema = z.object({
  password: z.string().min(6, {
    message: `${t.get('validations.reset.password.min_char')}`,
    invalid_type_error: `${t.get('validations.invalid_type_error')}`
  })
});

const onboardingValidationSchema = {
  stepOne: z.object({
    fullname: z
      .string()
      .min(5, { message: `${t.get('validations.onboarding.step_one.full_name.min_char')}` }),
    orgName: getOrgNameValidation(),
    siteName: getSiteNameValidation()
  }),
  stepTwo: z.object({
    goal: z
      .string({
        required_error: `${t.get('validations.onboarding.step_two.goal.required')}`,
        invalid_type_error: `${t.get('validations.onboarding.step_two.goal.required')}`
      })
      .min(1),
    source: z
      .string({
        required_error: `${t.get('validations.onboarding.step_two.source.required')}`,
        invalid_type_error: `${t.get('validations.onboarding.step_two.source.required')}`
      })
      .min(1)
  })
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

export const processErrors = (error, mapToId) => {
  const errors = {};

  if (Array.isArray(error?.issues)) {
    for (const issue of error.issues) {
      const { message, path } = issue;

      if (!path.length) {
        continue;
      }

      if (mapToId) {
        let value = '';
        path.forEach((p, i) => {
          const isLast = !path[i + 1];
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
      message: `${t.get('validations.course_payment.full_name.min_char')}`,
      invalid_type_error: `${t.get('validations.invalid_type_error')}`
    }),
    email: z.string().email({
      message: `${t.get('validations.course_payment.email.invalid_email')}`,
      invalid_type_error: `${t.get('validations.invalid_type_error')}`
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
export const updateProfileUsernameValidation = (username) => {
  const schema = z.object({
    username: z.string().nonempty({ message: `${t.get('validations.user_profile.username')}` })
  });
  const { error } = schema.safeParse({ username });
  console.log('error', error);

  return processErrors(error);
};

export const updateProfileFullnameValidation = (fullname) => {
  const schema = z.object({
    fullname: z.string().nonempty({ message: `${t.get('validations.user_profile.fullname')}` })
  });
  const { error } = schema.safeParse({ fullname });

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
