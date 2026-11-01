import { KeyRound } from 'lucide-react-native';

import { Icon } from '@/feature/common/components/icon';
import type { TextTone } from '@/feature/common/components/text';

import { BrandMarkIcon } from './brand-mark-icon';
import { GoogleMark } from './google-mark';

export type SsoProviderType = 'OKTA' | 'GOOGLE_WORKSPACE' | 'AUTH0';

type SsoProviderMarkProps = {
  providerType: SsoProviderType | null | undefined;
  size?: number;
  /** Renders single-colour marks in this tone, for marks placed on a filled button. */
  tone?: TextTone;
};

export function SsoProviderMark({ providerType, size = 18, tone }: SsoProviderMarkProps) {
  if (providerType === 'GOOGLE_WORKSPACE') return <GoogleMark size={size} contained={Boolean(tone)} />;
  if (providerType === 'OKTA') return <BrandMarkIcon name="okta" size={size} tone={tone} />;
  if (providerType === 'AUTH0') return <BrandMarkIcon name="auth0" size={size} tone={tone} />;

  return <Icon icon={KeyRound} size={size} tone={tone} />;
}
