import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const it: TranslatedMessages<typeof en> = {
  methodFingerprint: 'impronta digitale',
  methodFaceUnlock: 'sblocco con il volto',
  methodBiometrics: 'biometria',
  lockDuration: { one: '{count} minuto', other: '{count} minuti' },
  settingDescription: "Viene richiesto all'apertura dell'app e dopo {duration} in background.",
  settingSetUp: 'Per usare questa opzione, configura {method} nelle impostazioni del dispositivo.',
  settingUnsupported: 'Questo dispositivo non supporta lo sblocco biometrico.',
  turnOnPrompt: 'Attiva lo sblocco con {method}',
  stillOff: 'Lo sblocco con {method} è ancora disattivato',
  unlockWith: 'Sblocca con {method}',
  offerTitle: 'Sbloccare con {method}?',
  offerDescription:
    "ClassroomIO ti chiederà {method} quando apri l'app e quando torni dopo {duration} di assenza. In entrambi i casi resti connesso. Puoi cambiare questa scelta in Impostazioni.",
  notNow: 'Non ora',
  turnOn: 'Attiva',
  isOn: 'Sblocco con {method} attivato',
  isOnDescription: 'Puoi disattivarlo in Impostazioni.',
  isOff: 'Sblocco con {method} disattivato',
  unlockPrompt: 'Sblocca ClassroomIO',
  lockedTitle: 'ClassroomIO è bloccato',
  lockedDescription: 'Usa {method} per continuare.',
  lockedDescriptionWithEmail: 'Accesso effettuato come {email}. Usa {method} per continuare.',
  errorLockout: 'Troppi tentativi con {method}. Usa il codice del dispositivo.',
  errorNotSetUp: 'Configura prima {method} su questo dispositivo.',
  errorNotRecognized: 'Verifica con {method} non riuscita. Riprova.'
};
