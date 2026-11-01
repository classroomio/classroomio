import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const hi: TranslatedMessages<typeof en> = {
  title: 'सर्वर',
  description: 'सेल्फ़-होस्टेड संगठन अपना ClassroomIO API चलाते हैं। अपने एडमिनिस्ट्रेटर से मिला पता इस्तेमाल करें।',
  addressLabel: 'API पता',
  addressPlaceholder: 'api.yourcompany.com',
  currently: 'अभी {host}',
  connect: 'कनेक्ट करें',
  useCloud: 'ClassroomIO क्लाउड इस्तेमाल करें',
  updated: 'सर्वर अपडेट हो गया',
  unusable: 'उस सर्वर का इस्तेमाल नहीं हो सका।',
  unreachable: 'हम उस सर्वर तक नहीं पहुंच सके। पता और अपना कनेक्शन जांचें।',
  notClassroomio: 'उस पते ने ClassroomIO सर्वर की तरह जवाब नहीं दिया।'
};
