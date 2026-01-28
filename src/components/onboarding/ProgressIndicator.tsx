'use client';

import { useTranslations } from 'next-intl';

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const t = useTranslations('Onboarding');

  return (
    <div className="mb-8 flex flex-col items-center space-y-3">
      <span className="text-sm font-medium text-muted-foreground">
        {t('progressStep', { current: currentStep, total: totalSteps })}
      </span>
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <div
              key={stepNumber}
              className={`h-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-8 bg-primary'
                  : isCompleted
                    ? 'w-2 bg-primary'
                    : 'w-2 bg-muted'
              }`}
              aria-label={t('stepAriaLabel', { step: stepNumber, isCurrent: isActive ? 'true' : 'false' })}
            />
          );
        })}
      </div>
    </div>
  );
}
