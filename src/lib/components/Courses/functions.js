import { validateEmail } from '$lib/utils/functions/validateEmail';

export function validateForm(fields) {
  let hasError = false;
  const { students = '', tutors = '', title, description } = fields;
  const fieldErrors = {
    tutors: '',
    students: '',
    title: '',
    description: '',
  };

  const _tutors =
    tutors.length < 5
      ? []
      : tutors.split(',').map((_email) => {
          const email = _email.trim();

          if (!validateEmail(email)) {
            hasError = true;
            fieldErrors.tutors += !fieldErrors.tutors.length
              ? `Not valid email: ${email}`
              : `, ${email}`;
          }

          return email;
        });

  const _students =
    students.length < 5
      ? []
      : students.split(',').map((_email) => {
          const email = _email.trim();

          if (!validateEmail(email)) {
            hasError = true;
            fieldErrors.students += !fieldErrors.students.length
              ? `Not valid email: ${email}`
              : `, ${email}`;
          }

          return email;
        });

  if (!title) {
    fieldErrors.title = 'Title is required';
    return {
      hasError: true,
      fieldErrors,
    };
  }

  if (!description) {
    fieldErrors.description = 'Description is required';
    return {
      hasError: true,
      fieldErrors,
    };
  }

  return {
    hasError,
    fieldErrors,
    tutors: _tutors,
    students: _students,
  };
}
