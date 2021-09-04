export const VARIANTS = {
  CONTAINED: 'CONTAINED',
  CONTAINED_DANGER: 'CONTAINED_DANGER',
  CONTAINED_SUCCESS: 'CONTAINED_SUCCESS',
  OUTLINED: 'OUTLINED',
};

export const VARIANTS_CLASS = {
  [VARIANTS.CONTAINED]: 'bg-blue-700 hover:bg-blue-900 text-white font-bold',
  [VARIANTS.CONTAINED_SUCCESS]:
    'bg-green-700 hover:bg-green-900 text-white font-bold',
  [VARIANTS.CONTAINED_DANGER]:
    'bg-red-700 hover:bg-red-900 text-white font-bold',
  [VARIANTS.OUTLINED]:
    'border border-gray-700 hover:border-black-300 hover:bg-gray-200 text-black',
};
