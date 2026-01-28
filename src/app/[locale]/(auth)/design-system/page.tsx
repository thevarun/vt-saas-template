'use client';

import {
  Inbox,
  Loader2,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Design System Index Page
 * Navigation hub for all pattern libraries
 */
export default function DesignSystemPage() {
  const t = useTranslations('DesignSystem');

  const patternLibraries = [
    {
      icon: Inbox,
      title: 'Empty States',
      description: 'Helpful placeholders when no data exists',
      href: '/design-system/empty-states',
    },
    {
      icon: Loader2,
      title: 'Loading States',
      description: 'Skeletons, spinners, and loading patterns',
      href: '/design-system/loading',
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Palette className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('title')}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Libraries */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pattern Libraries
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {patternLibraries.map(library => (
            <Link
              key={library.href}
              href={library.href}
              className="group rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-700 dark:hover:bg-blue-950"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-blue-100 dark:bg-slate-700 dark:group-hover:bg-blue-900">
                  <library.icon className="size-5 text-slate-600 transition-colors group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {library.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {library.description}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400">
                Click to view →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
