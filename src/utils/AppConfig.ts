import type { LocalePrefixMode } from 'next-intl/routing';

import { SITE_CONFIG } from '@/config/site-config';

const localePrefix: LocalePrefixMode = 'as-needed';

export const AppConfig = {
  name: SITE_CONFIG.brand.name,
  locales: [
    {
      id: 'en',
      name: 'English',
    },
    { id: 'hi', name: 'हिन्दी' },
    { id: 'bn', name: 'বাংলা' },
  ],
  defaultLocale: 'en',
  localePrefix,
};

export const AllLocales = AppConfig.locales.map(locale => locale.id);
