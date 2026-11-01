import { useState } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { biometricIconOf } from '@/feature/biometric/helpers/biometric-icon';
import { setBiometricPreference, useBiometricPreference } from '@/feature/biometric/helpers/biometric-preference-store';
import { authenticateWithBiometrics } from '@/feature/biometric/helpers/biometric-support';
import { useBiometricSupport } from '@/feature/biometric/helpers/use-biometric-support';
import { Icon } from '@/feature/common/components/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Switch } from '@/feature/common/components/switch';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useBiometricCopy } from '@/feature/biometric/helpers/use-biometric-copy';

export function BiometricLockSetting() {
  const { userId } = useAuth();
  const preference = useBiometricPreference(userId);
  const support = useBiometricSupport();
  const [confirming, setConfirming] = useState(false);
  const { t, cancelLabel, failureMessage } = useBiometricCopy(support.data?.method);
  const available = support.data?.available ?? false;

  const describe = () => {
    if (available) return t('settingDescription');
    if (support.data?.hasHardware) return t('settingSetUp');

    return t('settingUnsupported');
  };

  const change = async (next: boolean) => {
    if (!userId) return;

    if (!next) {
      setBiometricPreference(userId, 'off');
      return;
    }

    setConfirming(true);
    const result = await authenticateWithBiometrics({ promptMessage: t('turnOnPrompt'), cancelLabel });
    setConfirming(false);

    if (result.success) setBiometricPreference(userId, 'on');
    else if (result.failure)
      showToast({ tone: 'warning', title: t('stillOff'), description: failureMessage(result.failure) });
  };

  return (
    <Item>
      <ItemMedia variant="tile">
        <Icon icon={biometricIconOf(support.data?.kind)} size={20} tone="ink" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{t('unlockWith')}</ItemTitle>
        <ItemDescription numberOfLines={3}>{describe()}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          accessibilityLabel={t('unlockWith')}
          value={preference === 'on'}
          disabled={confirming || (!available && preference !== 'on')}
          onValueChange={change}
        />
      </ItemActions>
    </Item>
  );
}
