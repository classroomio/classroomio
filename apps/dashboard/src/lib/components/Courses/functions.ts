export function validateForm(fields) {
  let hasError = false;
  const { title, description } = fields;
  const fieldErrors = {
    title: '',
    description: ''
  };

  if (!title) {
    fieldErrors.title = 'Title is required';
    hasError = true;
  }

  if (!description) {
    fieldErrors.description = 'Description is required';
    hasError = true;
  }

  return {
    hasError,
    fieldErrors
  };
}
