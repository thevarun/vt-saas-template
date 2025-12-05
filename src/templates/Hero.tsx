'use client';

import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

type HeroProps = {
  user: User | null;
};

export const Hero = ({ user }: HeroProps) => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-36">
      <CenteredHero
        title={t.rich('title', {
          important: chunks => (
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {chunks}
            </span>
          ),
        })}
        description={t('description')}
        buttons={(
          <>
            {/* AC #4: Show Dashboard for logged-in users, Sign Up for logged-out */}
            {user
              ? (
                  <Link
                    className={buttonVariants({ size: 'lg' })}
                    href="/dashboard"
                  >
                    {t('dashboard_button')}
                  </Link>
                )
              : (
                  <Link
                    className={buttonVariants({ size: 'lg' })}
                    href="/sign-up"
                  >
                    {t('primary_button')}
                  </Link>
                )}

            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="#features"
            >
              {t('secondary_button')}
            </a>
          </>
        )}
      />
    </Section>
  );
};
