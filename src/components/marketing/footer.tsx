import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { SITE_CONFIG } from '@/config/site-config';

import type { NavLink } from './nav-config';
import { flatNavLinks, resourcesLinks } from './nav-config';

/**
 * Marketing shell Footer (opt-in).
 *
 * Multi-column footer driven by `SITE_CONFIG` (brand name, tagline, logo,
 * social) + `nav-config` link sets. Chrome LABELS localise via the
 * `MarketingChrome` next-intl namespace. ADDITIVE — it does not replace
 * `src/templates/Footer.tsx`. Footer brand colours come from the self-contained
 * `--color-footer-*` tokens in `global.css`.
 */

const legalLinks: NavLink[] = [
  { labelKey: 'terms_of_service', href: '/terms' },
  { labelKey: 'privacy_policy', href: '/privacy' },
];

export const MarketingFooter = async () => {
  const t = await getTranslations('MarketingChrome');
  const { brand } = SITE_CONFIG;
  const socialEntries = Object.entries(brand.social) as [string, string][];

  return (
    <footer className="bg-footer-bg py-12 text-footer-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <Image
                src={brand.logo.nav}
                alt=""
                width={28}
                height={28}
                className="size-7"
              />
              <span className="text-2xl font-bold">{brand.name}</span>
            </div>
            <p className="mt-2 text-sm text-footer-foreground/70">
              {brand.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3 sm:gap-x-16">
            <div>
              <h4 className="text-xs font-semibold tracking-wider text-footer-foreground/60 uppercase">
                {t('product')}
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                {flatNavLinks.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="transition-colors hover:text-footer-foreground"
                    >
                      {t(l.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-wider text-footer-foreground/60 uppercase">
                {t('company')}
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                {resourcesLinks.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="transition-colors hover:text-footer-foreground"
                    >
                      {t(l.labelKey)}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:${brand.supportEmail}`}
                    className="transition-colors hover:text-footer-foreground"
                  >
                    {t('contact')}
                  </a>
                </li>
              </ul>

              {socialEntries.length > 0 && (
                <>
                  <h4 className="mt-6 text-xs font-semibold tracking-wider text-footer-foreground/60 uppercase">
                    {t('social')}
                  </h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    {socialEntries.map(([platform, url]) => (
                      <li key={platform}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="capitalize transition-colors hover:text-footer-foreground"
                        >
                          {platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-wider text-footer-foreground/60 uppercase">
                {t('legal')}
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                {legalLinks.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="transition-colors hover:text-footer-foreground"
                    >
                      {t(l.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-footer-foreground/10 pt-6 text-center text-xs text-footer-foreground/70">
          {t('copyright', {
            year: String(new Date().getFullYear()),
            name: brand.name,
          })}
        </div>
      </div>
    </footer>
  );
};
