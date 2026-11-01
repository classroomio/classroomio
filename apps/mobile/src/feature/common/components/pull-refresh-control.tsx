import { useState } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useTheme } from '@/feature/common/helpers/use-theme';

export type RefreshHandler = () => Promise<unknown>;

type PullRefreshControlProps = Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> & { onRefresh: RefreshHandler };

/** A refresh control that spins only for a pull the user started, never for background refetches. */
export function PullRefreshControl({ onRefresh, ...props }: PullRefreshControlProps) {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return <RefreshControl tintColor={colors.inkMuted} {...props} refreshing={refreshing} onRefresh={refresh} />;
}
