import Svg, { Path } from 'react-native-svg';

import { useTextColor, type TextTone } from '@/feature/common/components/text';
import { BRAND_MARKS, type BrandMarkName } from '@/feature/brand/constants/brand-marks';

type BrandMarkIconProps = {
  name: BrandMarkName;
  size?: number;
  /** Brand colour by default; a text tone renders the mark in that colour instead. */
  tone?: TextTone;
};

export function BrandMarkIcon({ name, size = 18, tone }: BrandMarkIconProps) {
  const mark = BRAND_MARKS[name];
  const toneColor = useTextColor(tone);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={mark.path} fill={tone ? toneColor : mark.hex} />
    </Svg>
  );
}
