import { use } from 'react';

import { ThemeContext } from '@/feature/common/components/theme-provider';

export function useTheme() {
  return use(ThemeContext);
}
