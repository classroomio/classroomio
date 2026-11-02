import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  roleAdmin: 'Yönetici',
  roleTutor: 'Eğitmen',
  roleStudent: 'Öğrenci',
  roleMember: 'Üye',
  loadError: 'Kuruluşlarınız yüklenmedi',
  noOrgTitle: 'Henüz kuruluş yok',
  noOrgDescription:
    'Bu hesap hiçbir kuruluşa üye değil. Eğitim yöneticinizden sizi davet etmesini isteyin, ardından yeniden giriş yapın.',
  chooseTitle: 'Bir kuruluş seçin',
  chooseDescription: 'Kuruluşunuzu daha sonra profilinizden değiştirebilirsiniz.'
};
