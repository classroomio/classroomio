import { ActivityIndicator } from 'react-native';

import { useTextColor, type TextTone } from './text';

type SpinnerProps = { size?: 'small' | 'large'; tone?: TextTone; color?: string };

export function Spinner({ size = 'small', tone = 'muted', color }: SpinnerProps) {
  const resolvedColor = useTextColor(tone, color);

  return <ActivityIndicator size={size} color={resolvedColor} />;
}
