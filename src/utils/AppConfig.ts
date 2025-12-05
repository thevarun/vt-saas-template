import type { LocalePrefix } from 'node_modules/next-intl/dist/types/src/routing/types';

const localePrefix: LocalePrefix = 'as-needed';

export const AppConfig = {
  name: 'HealthCompanion',
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
