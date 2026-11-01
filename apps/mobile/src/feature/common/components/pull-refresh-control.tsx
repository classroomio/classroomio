import { useState } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useTheme } from '@/feature/common/helpers/use-theme';

export type RefreshHandler = () => Promise<unknown>;

// Ending a refresh before the pull settles makes iOS large-title headers jump.
const MIN_REFRESH_MS = 600;

const settle = () => new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_MS));

type PullRefreshControlProps = Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> & { onRefresh: RefreshHandler };

/** A refresh control that spins only for a pull the user started, never for background refetches. */
export function PullRefreshControl({ onRefresh, ...props }: PullRefreshControlProps) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([onRefresh(), settle()]);
    } finally {
      setRefreshing(false);
    }
  };

  return <RefreshControl tintColor={colors.inkMuted} {...props} refreshing={refreshing} onRefresh={refresh} />;
}
