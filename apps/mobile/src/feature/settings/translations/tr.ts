import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const tr: TranslatedMessages<typeof en> = {
  account: 'Hesap',
  name: 'Ad',
  notSet: 'Ayarlanmadı',
  email: 'E-posta',
  notifications: 'Bildirimler',
  notificationsDescription: 'Anlık, uygulama içi, e-posta ve sessiz saatler',
  security: 'Güvenlik',
  theme: 'Tema',
  themeSystem: 'Sistem',
  themeLight: 'Açık',
  themeDark: 'Koyu',
  language: 'Dil',
  languageSystem: 'Sistem',
  languageSystemDescription: 'Cihazınızın diliyle aynı',
  languageNotSaved: 'Dil hesabınıza kaydedilmedi',
  about: 'Hakkında',
  version: 'Sürüm',
  versionUnknown: 'Bilinmiyor',
  server: 'Sunucu',
  serverDescription: 'Başka bir sunucuya bağlanmak için oturumu kapatın.'
};
