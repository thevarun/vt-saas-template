'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { trackEvent, trackOnboardingStepCompleted } from '@/libs/analytics';
import { usernameSchema } from '@/libs/validations/username';

import { ProgressIndicator } from './ProgressIndicator';
import { UsernameInput } from './UsernameInput';

const usernameFormSchema = z.object({
  username: usernameSchema,
});

type UsernameFormData = z.infer<typeof usernameFormSchema>;

type OnboardingUsernameProps = {
  initialData: {
    username: string;
    isNewUser: boolean;
  };
};

export function OnboardingUsername({ initialData }: OnboardingUsernameProps) {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  // Track onboarding start on component mount (first step)
  useEffect(() => {
    const onboardingStartTime = localStorage.getItem('onboarding_start_time');
    if (!onboardingStartTime) {
      localStorage.setItem('onboarding_start_time', Date.now().toString());
      trackEvent('onboarding_started', {});
    }
  }, []);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isValid: isZodValid },
  } = useForm<UsernameFormData>({
    resolver: zodResolver(usernameFormSchema),
    mode: 'onChange',
    defaultValues: {
      username: initialData.username,
    },
  });

  const username = watch('username');
  // Skip availability check if username hasn't changed from initial value
  const skipAvailabilityCheck = username === initialData.username && !initialData.isNewUser;
  const validation = useUsernameValidation(username, skipAvailabilityCheck);

  const handleUsernameChange = (value: string) => {
    setValue('username', value, { shouldValidate: true });
  };

  const onSubmit = async (data: UsernameFormData) => {
    // If username unchanged and user already exists, just proceed
    if (skipAvailabilityCheck) {
      trackOnboardingStepCompleted(1, 'username');
      window.location.href = `${localePrefix}/onboarding?step=2`;
      return;
    }

    if (!validation.isValid || !validation.isAvailable) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile/update-username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username }),
      });

      const result = await response.json();

      if (response.ok) {
        trackOnboardingStepCompleted(1, 'username');

        toast({
          title: 'Success',
          description: 'Your username has been saved',
        });
        // Use hard navigation for server component page with query params
        window.location.href = `${localePrefix}/onboarding?step=2`;
      } else {
        toast({
          title: 'Error',
          description: result.error || t('errorSaving'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: t('errorNetwork'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form is valid if:
  // - Username passes Zod validation AND
  // - Either username is unchanged (skipAvailabilityCheck) OR it's available
  const isFormValid = isZodValid && (skipAvailabilityCheck || (validation.isValid && validation.isAvailable && !validation.isChecking));

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-100/50 bg-white p-8 shadow-xl dark:border-slate-800/50 dark:bg-slate-900 md:p-10">
        {/* Progress */}
        <ProgressIndicator currentStep={1} totalSteps={3} />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t('step1Title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('step1Description')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <UsernameInput
            value={username}
            onChange={handleUsernameChange}
            isValid={skipAvailabilityCheck || validation.isValid}
            isAvailable={skipAvailabilityCheck || validation.isAvailable}
            error={skipAvailabilityCheck ? null : validation.error}
            isChecking={skipAvailabilityCheck ? false : validation.isChecking}
          />

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              disabled={!isFormValid || isSubmitting}
            >
              <span>{isSubmitting ? t('saving') : t('continue')}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
