import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const da: TranslatedMessages<typeof en> = {
  methodFingerprint: 'fingeraftryk',
  methodFaceUnlock: 'ansigtsoplåsning',
  methodBiometrics: 'biometri',
  lockDuration: { one: '{count} minut', other: '{count} minutter' },
  settingDescription: 'Spørger, når du åbner appen, og efter {duration} i baggrunden.',
  settingSetUp: 'Konfigurer {method} i enhedens indstillinger for at bruge det her.',
  settingUnsupported: 'Denne enhed understøtter ikke biometrisk oplåsning.',
  turnOnPrompt: 'Slå oplåsning med {method} til',
  stillOff: 'Oplåsning med {method} er stadig slået fra',
  unlockWith: 'Lås op med {method}',
  offerTitle: 'Lås op med {method}?',
  offerDescription:
    'ClassroomIO beder om {method}, når du åbner appen, og når du vender tilbage efter {duration} væk. Du forbliver logget ind uanset hvad. Du kan ændre det i Indstillinger.',
  notNow: 'Ikke nu',
  turnOn: 'Slå til',
  isOn: 'Oplåsning med {method} er slået til',
  isOnDescription: 'Du kan slå det fra i Indstillinger.',
  isOff: 'Oplåsning med {method} er slået fra',
  unlockPrompt: 'Lås ClassroomIO op',
  lockedTitle: 'ClassroomIO er låst',
  lockedDescription: 'Brug {method} for at fortsætte.',
  lockedDescriptionWithEmail: 'Logget ind som {email}. Brug {method} for at fortsætte.',
  errorLockout: '{method} er låst efter for mange forsøg. Brug din enheds adgangskode.',
  errorNotSetUp: '{method} er ikke konfigureret på denne enhed.',
  errorNotRecognized: '{method} genkendte dig ikke. Prøv igen.'
};
