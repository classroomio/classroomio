export const VARIANTS = {
  CONTAINED: 'CONTAINED',
  CONTAINED_DANGER: 'CONTAINED_DANGER',
  CONTAINED_SUCCESS: 'CONTAINED_SUCCESS',
  OUTLINED: 'OUTLINED',
  NONE: 'NONE',
};

export const VARIANTS_CLASS = {
  [VARIANTS.CONTAINED]: 'border-none bg-blue-700 hover:bg-blue-900 text-white',
  [VARIANTS.CONTAINED_SUCCESS]: 'bg-green-700 hover:bg-green-900 text-white',
  [VARIANTS.CONTAINED_DANGER]: 'bg-red-700 hover:bg-red-900 text-white',
  [VARIANTS.OUTLINED]:
    'border border-gray hover:border-black-300 hover:bg-gray-200 text-black',
  [VARIANTS.NONE]:
    'border-none hover:border-black-300 hover:bg-gray-200 text-black',
};
