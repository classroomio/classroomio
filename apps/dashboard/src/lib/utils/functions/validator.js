import isNumber from 'lodash/isNumber';
import z from 'zod';
import { validateEmail } from './validateEmail';

const getOrgNameValidation = () =>
  z.string().min(5, { message: 'Organization must contain 5 or more characters' });

const getSiteNameValidation = () =>
  z.string().min(5, { message: 'Site name must contain 5 or more characters' });

const getNewsfeedValidation = () =>
  z.string().min(5, { message: 'Field must contain 5 or more characters' });

const createQuizValidationSchema = z.object({
  title: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  })
});

const askCommunityValidationSchema = z.object({
  title: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  }),
  body: z.string().min(20, {
    message: 'Must be 10 or more characters long',
    invalid_type_error: 'Must not be empty'
  }),
  courseId: z.string().min(36, {
    message: 'Select a course',
    invalid_type_error: 'Select a course'
  })
});
const commentInCommunityValidationSchema = z.object({
  comment: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  })
});

const orgLandingpageValidationSchema = z.object({
  name: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  }),
  email: z.string().email({
    message: 'Invalid email address',
    invalid_type_error: 'Must not be empty'
  }),
  phone: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  }),
  message: z.string().min(20, {
    message: 'Must be 10 or more characters long',
    invalid_type_error: 'Must not be empty'
  })
});

const forgotValidationSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address',
    invalid_type_error: 'Must not be empty'
  })
});

const authValidationSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address',
    invalid_type_error: 'Must not be empty'
  }),
  password: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  })
});

const resetValidationSchema = z.object({
  password: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty'
  })
});

const onboardingValidationSchema = {
  stepOne: z.object({
    fullname: z.string().min(5, { message: 'Fullname must contain 5 or more characters' }),
    orgName: getOrgNameValidation(),
    siteName: getSiteNameValidation()
  }),
  stepTwo: z.object({
    goal: z
      .string({
        required_error: 'Select an option',
        invalid_type_error: 'Select an option'
      })
      .min(1),
    source: z
      .string({
        required_error: 'Select an option',
        invalid_type_error: 'Select an option'
      })
      .min(1)
  })
};

export const getConfirmPasswordError = ({ password, confirmPassword }) => {
  return password > 6 && confirmPassword > 6 && password !== confirmPassword
    ? 'Does not match password'
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

export const coursePaymentValidation = (fields = {}) => {
  const schema = z.object({
    fullname: z.string().min(6, {
      message: 'Must be 6 or more characters long',
      invalid_type_error: 'Must not be empty'
    }),
    email: z.string().email({
      message: 'Invalid email address',
      invalid_type_error: 'Must not be empty'
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

export const updateOrgSiteNameValidation = (siteName) => {
  const schema = z.object({
    siteName: getSiteNameValidation()
  });
  const { error } = schema.safeParse({ siteName });

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
      error += !error.length ? `Not valid email: ${email}` : `, ${email}`;
    }

    return email;
  });

  return {
    hasError,
    error,
    emails
  };
};
