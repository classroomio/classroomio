import type { IconWeight, Icon as PhosphorIcon } from 'phosphor-react-native';

import { useTextColor, type TextTone } from './text';

export type AppIcon = PhosphorIcon;

type IconProps = {
  icon: AppIcon;
  size?: number;
  tone?: TextTone;
  color?: string;
  weight?: IconWeight;
};

export function Icon({ icon: Glyph, size = 20, tone, color, weight = 'regular' }: IconProps) {
  const resolvedColor = useTextColor(tone, color);

  return <Glyph size={size} color={resolvedColor} weight={weight} />;
}
