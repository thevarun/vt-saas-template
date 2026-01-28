'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Bell, Check, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import { ProgressIndicator } from './ProgressIndicator';

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  language: z.enum(['en', 'hi', 'bn']),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

type OnboardingPreferencesProps = {
  initialData: {
    username: string;
    emailNotifications: boolean;
    language: string;
    isNewUser: boolean;
  };
};

export function OnboardingPreferences({ initialData }: OnboardingPreferencesProps) {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      emailNotifications: initialData.emailNotifications,
      language: (initialData.language as 'en' | 'hi' | 'bn') || 'en',
    },
  });

  const emailNotifications = form.watch('emailNotifications');
  const language = form.watch('language');

  const onSubmit = async (data: PreferencesFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile/update-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // Include username for new users (creates record)
          username: initialData.username,
          isNewUser: initialData.isNewUser,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      setIsComplete(true);

      toast({
        title: t('successMessage'),
        variant: 'default',
      });

      // Hard navigation to apply language change
      setTimeout(() => {
        window.location.href = `/${data.language}/dashboard`;
      }, 2000);
    } catch (error) {
      toast({
        title: t('errorSaving'),
        description: error instanceof Error ? error.message : t('errorNetwork'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    // Use hard navigation for server component page with query params
    window.location.href = `${localePrefix}/onboarding?step=2`;
  };

  if (isComplete) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-100/50 bg-white p-8 text-center shadow-xl duration-500 animate-in fade-in zoom-in dark:border-slate-800/50 dark:bg-slate-900">
          <div className="mb-6 flex justify-center">
            <div className="flex size-20 animate-bounce items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <Check className="size-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {t('successMessage').split('!')[0]}
            !
          </h2>
          <p className="mb-8 text-slate-600 dark:text-slate-400">
            {t('successMessage').split('Redirecting')[0]}
          </p>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="size-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s] dark:bg-blue-400"></div>
              <div className="size-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s] dark:bg-blue-400"></div>
              <div className="size-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-100/50 bg-white shadow-xl dark:border-slate-800/50 dark:bg-slate-900">
          <div className="p-8 md:p-10">
            <ProgressIndicator currentStep={3} totalSteps={3} />

            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">
                {t('step3Title')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('step3Description')}
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Notifications Section */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <Bell className="mt-0.5 size-5 text-slate-600 dark:text-slate-400" />
                    <div className="flex-1">
                      <Label
                        htmlFor="notifications"
                        className="text-sm font-semibold text-slate-900 dark:text-slate-50"
                      >
                        {t('notificationsLabel')}
                      </Label>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t('notificationsDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="notifications"
                    checked={emailNotifications}
                    onCheckedChange={(checked: boolean) =>
                      form.setValue('emailNotifications', checked)}
                  />
                </div>
              </div>

              {/* Language Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Globe className="size-4 text-slate-600 dark:text-slate-400" />
                  <Label
                    htmlFor="language"
                    className="text-sm font-semibold text-slate-900 dark:text-slate-50"
                  >
                    {t('languageLabel')}
                  </Label>
                </div>
                <Select
                  value={language}
                  onValueChange={(value: string) =>
                    form.setValue('language', value as 'en' | 'hi' | 'bn')}
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder={t('languageLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('languageEn')}</SelectItem>
                    <SelectItem value="hi">{t('languageHi')}</SelectItem>
                    <SelectItem value="bn">{t('languageBn')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="px-1 text-xs text-slate-400 dark:text-slate-500">
                  {t('languageDescription')}
                </p>
              </div>

              <div className="mt-10 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={handleGoBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="size-4" />
                  <span>{t('goBack')}</span>
                </Button>

                <Button
                  type="submit"
                  className="flex-1 gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? t('saving') : t('completeSetup')}</span>
                  {!isSubmitting && <ArrowRight className="size-4" />}
                </Button>
              </div>
            </form>
          </div>

          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>
      </div>
    </div>
  );
}
