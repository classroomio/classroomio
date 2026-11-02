import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  methodFingerprint: 'parmak izi',
  methodFaceUnlock: 'yüz tanıma',
  methodBiometrics: 'biyometri',
  lockDuration: { other: '{count} dakika' },
  settingDescription: 'Uygulamayı açtığınızda ve arka planda {duration} kaldıktan sonra sorar.',
  settingSetUp: 'Bu seçeneği kullanmak için cihaz ayarlarında {method} kurulumunu yapın.',
  settingUnsupported: 'Bu cihaz biyometrik kilit açmayı desteklemiyor.',
  turnOnPrompt: '{method} ile kilit açmayı etkinleştir',
  stillOff: '{method} ile kilit açma hâlâ kapalı',
  unlockWith: '{method} ile kilidi aç',
  offerTitle: '{method} ile kilit açılsın mı?',
  offerDescription:
    "ClassroomIO, uygulamayı açtığınızda ve {duration} uzak kaldıktan sonra döndüğünüzde {method} doğrulaması ister. Her iki durumda da oturumunuz açık kalır. Bunu Ayarlar'dan değiştirebilirsiniz.",
  notNow: 'Şimdi değil',
  turnOn: 'Aç',
  isOn: '{method} ile kilit açma açık',
  isOnDescription: "Ayarlar'dan kapatabilirsiniz.",
  isOff: '{method} ile kilit açma kapalı',
  unlockPrompt: 'ClassroomIO kilidini aç',
  lockedTitle: 'ClassroomIO kilitli',
  lockedDescription: 'Devam etmek için {method} kullanın.',
  lockedDescriptionWithEmail: '{email} olarak oturum açıldı. Devam etmek için {method} kullanın.',
  errorLockout: 'Çok fazla {method} denemesi yapıldı. Cihazınızın parolasını kullanın.',
  errorNotSetUp: 'Bu cihazda {method} ayarlanmamış.',
  errorNotRecognized: '{method} doğrulaması başarısız oldu. Tekrar deneyin.'
};
