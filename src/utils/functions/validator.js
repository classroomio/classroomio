import z from 'zod';

const forgotValidationSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address',
    invalid_type_error: 'Must not be empty',
  }),
});

const authValidationSchema = z.object({
  email: z.string().email({
    message: 'Invalid email address',
    invalid_type_error: 'Must not be empty',
  }),
  password: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty',
  }),
});

const resetValidationSchema = z.object({
  password: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty',
  }),
});

const onboardingValidationSchema = {
  stepOne: z.object({
    fullname: z.string().min(1, { message: 'Enter your fullname' }),
    role: z.string({
      required_error: 'Please select a goal',
      invalid_type_error: 'Please select a goal',
    }),
  }),
  stepTwo: z.object({
    goal: z
      .string({
        required_error: 'Select an option',
        invalid_type_error: 'Select an option',
      })
      .min(1),
    source: z
      .string({
        required_error: 'Select an option',
        invalid_type_error: 'Select an option',
      })
      .min(1),
  }),
};

export const getConfirmPasswordError = ({ password, confirmPassword }) => {
  return password > 6 && confirmPassword > 6 && password !== confirmPassword
    ? 'Does not match password'
    : null;
};

const processErrors = (error) => {
  const errors = {};

  if (Array.isArray(error?.issues)) {
    for (const issue of error.issues) {
      const { message, path } = issue;
      console.log(issue);
      if (path.length) {
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

export const resetValidation = (fields = {}) => {
  const { error } = resetValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const forgotValidation = (fields = {}) => {
  const { error } = forgotValidationSchema.safeParse(fields);

  return processErrors(error);
};

export const onboardingValidation = (fields = {}, step) => {
  const schema =
    step === 1
      ? onboardingValidationSchema.stepOne
      : onboardingValidationSchema.stepTwo;
  const { error } = schema.safeParse(fields);

  return processErrors(error);
};

export const getDisableSubmit = ({ password, confirmPassword }) => {
  return !!(password && confirmPassword && password !== confirmPassword);
};
