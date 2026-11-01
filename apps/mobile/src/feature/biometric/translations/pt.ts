import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pt: TranslatedMessages<typeof en> = {
  methodFingerprint: 'impressão digital',
  methodFaceUnlock: 'desbloqueio facial',
  methodBiometrics: 'biometria',
  lockDuration: { one: '{count} minuto', other: '{count} minutos' },
  settingDescription: 'Pedido ao abrir o app e depois de {duration} em segundo plano.',
  settingSetUp: 'Para usar esta opção, configure {method} nos ajustes do dispositivo.',
  settingUnsupported: 'Este dispositivo não é compatível com desbloqueio biométrico.',
  turnOnPrompt: 'Ativar desbloqueio com {method}',
  stillOff: 'O desbloqueio com {method} continua desativado',
  unlockWith: 'Desbloquear com {method}',
  offerTitle: 'Desbloquear com {method}?',
  offerDescription:
    'O ClassroomIO vai pedir {method} quando você abrir o app e quando voltar depois de {duration} fora. Você continua conectado nos dois casos. Você pode mudar isso em Ajustes.',
  notNow: 'Agora não',
  turnOn: 'Ativar',
  isOn: 'Desbloqueio com {method} ativado',
  isOnDescription: 'Você pode desativá-lo em Ajustes.',
  isOff: 'Desbloqueio com {method} desativado',
  unlockPrompt: 'Desbloquear o ClassroomIO',
  lockedTitle: 'O ClassroomIO está bloqueado',
  lockedDescription: 'Use {method} para continuar.',
  lockedDescriptionWithEmail: 'Conectado como {email}. Use {method} para continuar.',
  errorLockout: 'Muitas tentativas com {method}. Use o código do dispositivo.',
  errorNotSetUp: 'Configure {method} neste dispositivo primeiro.',
  errorNotRecognized: 'Não foi possível verificar com {method}. Tente novamente.'
};
