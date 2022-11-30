import z from 'zod';

const validationSchema = z.object({
  name: z.string().min(3, {
    message: 'Must be 3 or more characters long',
    invalid_type_error: 'Must not be empty',
  }),
  email: z.string().email({
    message: 'Invalid email address',
    invalid_type_error: 'Must not be empty',
  }),
  password: z.string().min(6, {
    message: 'Must be 6 or more characters long',
    invalid_type_error: 'Must not be empty',
  }),
});

export const getConfirmPasswordError = ({ password, confirmPassword }) => {
  return password > 6 && confirmPassword > 6 && password !== confirmPassword
    ? 'Does not match password'
    : null;
};

export const signUpValidation = (fields = {}) => {
  const { error } = validationSchema.safeParse(fields);
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

export const getDisableSubmit = ({ password, confirmPassword }) => {
  return !!(password && confirmPassword && password !== confirmPassword);
};
