import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const es: TranslatedMessages<typeof en> = {
  methodFingerprint: 'huella digital',
  methodFaceUnlock: 'desbloqueo facial',
  methodBiometrics: 'biometría',
  lockDuration: { one: '{count} minuto', other: '{count} minutos' },
  settingDescription: 'Se solicita al abrir la app y después de {duration} en segundo plano.',
  settingSetUp: 'Para usar esta opción, configura {method} en los ajustes del dispositivo.',
  settingUnsupported: 'Este dispositivo no admite el desbloqueo biométrico.',
  turnOnPrompt: 'Activar desbloqueo con {method}',
  stillOff: 'El desbloqueo con {method} sigue desactivado',
  unlockWith: 'Desbloquear con {method}',
  offerTitle: '¿Desbloquear con {method}?',
  offerDescription:
    'ClassroomIO te pedirá {method} al abrir la app y al volver después de {duration} fuera. Tu sesión sigue iniciada en ambos casos. Puedes cambiarlo en Ajustes.',
  notNow: 'Ahora no',
  turnOn: 'Activar',
  isOn: 'Desbloqueo con {method} activado',
  isOnDescription: 'Puedes desactivarlo en Ajustes.',
  isOff: 'Desbloqueo con {method} desactivado',
  unlockPrompt: 'Desbloquear ClassroomIO',
  lockedTitle: 'ClassroomIO está bloqueado',
  lockedDescription: 'Usa {method} para continuar.',
  lockedDescriptionWithEmail: 'Sesión iniciada como {email}. Usa {method} para continuar.',
  errorLockout: 'Demasiados intentos con {method}. Usa el código del dispositivo.',
  errorNotSetUp: 'Primero configura {method} en este dispositivo.',
  errorNotRecognized: 'No se pudo verificar con {method}. Inténtalo de nuevo.'
};
