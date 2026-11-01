import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  title: 'Sunucu',
  description:
    "Kendi sunucusunu barındıran kuruluşlar kendi ClassroomIO API'lerini çalıştırır. Yöneticinizin verdiği adresi kullanın.",
  addressLabel: 'API adresi',
  addressPlaceholder: 'api.sirketiniz.com',
  currently: 'Şu anda {host}',
  connect: 'Bağlan',
  useCloud: 'ClassroomIO bulutunu kullan',
  updated: 'Sunucu güncellendi',
  unusable: 'Bu sunucu kullanılamadı.',
  unreachable: 'Sunucuya ulaşılamadı. Adresi ve bağlantınızı kontrol edin.',
  notClassroomio: 'Bu adres bir ClassroomIO sunucusu gibi yanıt vermedi.'
};
