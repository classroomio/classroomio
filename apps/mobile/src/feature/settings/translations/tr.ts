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
  serverDescription: 'Başka bir sunucuya bağlanmak için oturumu kapatın.',
  appearance: 'Görünüm',
  general: 'Genel',
  videoAndDownloads: 'Video ve indirmeler',
  videoQuality: 'Akış kalitesi',
  videoQualityAuto: 'Otomatik',
  videoQualityAutoDescription: 'Bağlantınızın izin verdiği en iyi kalite',
  videoQualityStandard: "720p'ye kadar",
  videoQualityStandardDescription: 'Daha az mobil veri kullanır',
  videoQualityDataSaver: 'Veri tasarrufu',
  videoQualityDataSaverDescription: "480p'ye kadar, en az mobil veriyi kullanır",
  videoQualityFooter:
    'Kuruluşunuzun yayınladığı videolar için en yüksek çözünürlüğü belirler. İndirilen dersler ile YouTube veya Vimeo videoları etkilenmez.',
  downloads: 'İndirilenler'
};
