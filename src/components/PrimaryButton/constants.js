export const VARIANTS = {
  CONTAINED: 'CONTAINED',
  CONTAINED_DANGER: 'CONTAINED_DANGER',
  CONTAINED_SUCCESS: 'CONTAINED_SUCCESS',
  OUTLINED: 'OUTLINED',
  NONE: 'NONE',
  TEXT: 'TEXT',
  TEXT_DANGER: 'TEXT_DANGER',
};

export const VARIANTS_CLASS = {
  [VARIANTS.CONTAINED]: 'border-none bg-blue-700 hover:bg-blue-900 text-white',
  [VARIANTS.CONTAINED_SUCCESS]: 'bg-green-700 hover:bg-green-900 text-white',
  [VARIANTS.CONTAINED_DANGER]: 'bg-red-700 hover:bg-red-900 text-white',
  [VARIANTS.OUTLINED]:
    'border border-blue-700 hover:border-black-300 hover:bg-blue-200 text-black',
  [VARIANTS.NONE]:
    'border-none hover:border-black-300 hover:bg-gray-200 text-black',
  [VARIANTS.TEXT]:
    'text-black hover:border border-t-0 border-l-0 border-r-0 border-black-300',
  [VARIANTS.TEXT_DANGER]:
    'text-red-500 hover:border border-t-0 border-l-0 border-r-0 border-red-300',
};
