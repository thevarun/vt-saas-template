import type { LocalePrefixMode } from 'next-intl/routing';

const localePrefix: LocalePrefixMode = 'as-needed';

export const AppConfig = {
  name: 'VT SaaS Template',
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
