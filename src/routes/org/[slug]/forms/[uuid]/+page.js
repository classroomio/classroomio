import { readableForms } from '../store';

export const load = ({ params = { uuid: '' } }) => {
  const formData = readableForms.find((form) => form.id === params.uuid);

  return {
    uuid: params.uuid,
    form: formData
  };
};
