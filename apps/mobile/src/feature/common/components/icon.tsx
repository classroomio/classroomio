import type { LucideIcon } from 'lucide-react-native';

import { ICON_STROKE } from '@/feature/common/constants/layout';

import { useTextColor, type TextTone } from './text';

type IconProps = {
  icon: LucideIcon;
  size?: number;
  tone?: TextTone;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ icon: Glyph, size = 20, tone, color, strokeWidth = ICON_STROKE }: IconProps) {
  const resolvedColor = useTextColor(tone, color);

  return <Glyph size={size} color={resolvedColor} strokeWidth={strokeWidth} absoluteStrokeWidth />;
}
