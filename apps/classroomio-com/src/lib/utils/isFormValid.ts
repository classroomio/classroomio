export const isFormValid = (data: { [x: string]: any }) => {
  for (const key in data) {
    if (!data[key]) {
      return false;
    }
  }
  return true;
};
