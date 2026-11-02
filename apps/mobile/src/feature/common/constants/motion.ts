import { Easing } from 'react-native-reanimated';

export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

export const DURATION = {
  press: 120,
  fast: 160,
  base: 240
} as const;

export const PRESS_SCALE = 0.97;
