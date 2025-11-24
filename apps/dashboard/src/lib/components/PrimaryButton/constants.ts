import type { ButtonVariant } from '@cio/ui/base/button';

export const VARIANTS = {
  CONTAINED: 'CONTAINED',
  CONTAINED_DARK: 'CONTAINED_DARK',
  CONTAINED_LIGHT: 'CONTAINED_LIGHT',
  CONTAINED_INFO: 'CONTAINED_INFO',
  CONTAINED_WHITE: 'CONTAINED_WHITE',
  CONTAINED_DANGER: 'CONTAINED_DANGER',
  CONTAINED_SUCCESS: 'CONTAINED_SUCCESS',
  OUTLINED: 'OUTLINED',
  NONE: 'NONE',
  LINK: 'LINK',
  TEXT: 'TEXT',
  TEXT_DANGER: 'TEXT_DANGER'
};

export const VARIANTS_CLASS = {
  [VARIANTS.CONTAINED]: 'border-none bg-primary-700 hover:bg-primary-900 text-white',
  [VARIANTS.CONTAINED_DARK]: 'border-none bg-black hover:bg-neutral-600 text-white dark:bg-white dark:text-black',
  [VARIANTS.CONTAINED_LIGHT]: 'border-none bg-primary-600 hover:bg-primary-900 text-white',
  [VARIANTS.CONTAINED_WHITE]:
    'border-none bg-white hover:border-black-300 hover:bg-primary-700 dark:hover:bg-primary-900 text-black',
  [VARIANTS.CONTAINED_INFO]: 'border-none bg-gray-400 hover:bg-gray-600 text-white',
  [VARIANTS.CONTAINED_SUCCESS]: 'bg-green-700 hover:bg-green-900 text-white',
  [VARIANTS.CONTAINED_DANGER]: 'bg-red-700 hover:bg-red-900 text-white',
  [VARIANTS.OUTLINED]:
    'border border-black dark:border-white hover:bg-neutral-600 hover:text-white text-black dark:text-white',
  [VARIANTS.NONE]: 'border-none hover:border-black-300 hover:bg-gray-200 dark:hover:bg-neutral-800 text-black',
  [VARIANTS.TEXT]: 'text-black dark:text-white hover:underline',
  [VARIANTS.LINK]: 'text-primary-500 dark:text-primary-500 hover:underline',
  [VARIANTS.TEXT_DANGER]: 'text-red-500 hover:border border-t-0 border-l-0 border-r-0 border-red-300'
};

export const VARIANT_TO_BASE_VARIANT: Record<string, ButtonVariant> = {
  [VARIANTS.CONTAINED]: 'default',
  [VARIANTS.CONTAINED_DARK]: 'default',
  [VARIANTS.CONTAINED_LIGHT]: 'default',
  [VARIANTS.CONTAINED_WHITE]: 'default',
  [VARIANTS.CONTAINED_INFO]: 'secondary',
  [VARIANTS.CONTAINED_SUCCESS]: 'default',
  [VARIANTS.CONTAINED_DANGER]: 'destructive',
  [VARIANTS.OUTLINED]: 'outline',
  [VARIANTS.NONE]: 'ghost',
  [VARIANTS.TEXT]: 'ghost',
  [VARIANTS.LINK]: 'link',
  [VARIANTS.TEXT_DANGER]: 'destructive'
};
