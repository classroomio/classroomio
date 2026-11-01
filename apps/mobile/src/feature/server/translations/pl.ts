import type { TranslatedMessages } from '@/feature/i18n/types/i18n';

import type { en } from './en';

export const pl: TranslatedMessages<typeof en> = {
  title: 'Serwer',
  description:
    'Organizacje z własnym hostingiem mają własne API ClassroomIO. Użyj adresu podanego przez administratora.',
  addressLabel: 'Adres API',
  addressPlaceholder: 'api.twojafirma.pl',
  currently: 'Obecnie {host}',
  connect: 'Połącz',
  useCloud: 'Użyj chmury ClassroomIO',
  updated: 'Serwer zaktualizowany',
  unusable: 'Nie można użyć tego serwera.',
  unreachable: 'Nie udało się połączyć z serwerem. Sprawdź adres i połączenie.',
  notClassroomio: 'Ten adres nie odpowiada jak serwer ClassroomIO.'
};
