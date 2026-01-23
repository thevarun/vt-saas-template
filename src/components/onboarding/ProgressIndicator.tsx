'use client';

import { useTranslations } from 'next-intl';

import { Progress } from '@/components/ui/progress';

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const t = useTranslations('Onboarding');
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{t('progressStep', { current: currentStep, total: totalSteps })}</span>
        <span>
          {Math.round(progressPercentage)}
          %
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
