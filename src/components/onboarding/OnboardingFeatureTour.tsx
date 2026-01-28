'use client';

import { ArrowLeft, ArrowRight, Globe, MessageSquare, Shield, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

import { ProgressIndicator } from './ProgressIndicator';

type FeatureCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
};

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group cursor-default rounded-xl border border-slate-100 bg-slate-50/50 p-5 transition-all duration-300 hover:border-slate-200 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-colors duration-300 group-hover:border-primary/20 group-hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-800">
        <Icon className="size-5 text-slate-600 transition-colors duration-300 group-hover:text-primary dark:text-slate-400 dark:group-hover:text-primary" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-slate-50 dark:group-hover:text-slate-100">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export function OnboardingFeatureTour() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  const handleContinue = () => {
    // Use hard navigation for server component page with query params
    window.location.href = `${localePrefix}/onboarding?step=3`;
  };

  const handleGoBack = () => {
    // Use hard navigation for server component page with query params
    window.location.href = `${localePrefix}/onboarding?step=1`;
  };

  const features = [
    {
      icon: MessageSquare,
      title: t('feature1Title'),
      description: t('feature1Description'),
    },
    {
      icon: Globe,
      title: t('feature2Title'),
      description: t('feature2Description'),
    },
    {
      icon: Shield,
      title: t('feature3Title'),
      description: t('feature3Description'),
    },
    {
      icon: Zap,
      title: t('feature4Title'),
      description: t('feature4Description'),
    },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-100/50 bg-white p-8 shadow-xl dark:border-slate-800/50 dark:bg-slate-900 md:p-10">
        {/* Progress */}
        <ProgressIndicator currentStep={2} totalSteps={3} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t('step2Title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('step2Description')}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {features.map(feature => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleGoBack}
          >
            <ArrowLeft className="size-4" />
            <span>{t('goBack')}</span>
          </Button>

          <Button
            type="button"
            className="flex-1 gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            onClick={handleContinue}
          >
            <span>{t('continue')}</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
