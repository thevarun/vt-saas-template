'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';

import { ProgressIndicator } from './ProgressIndicator';
import { UsernameInput } from './UsernameInput';

const usernameFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores'),
});

type UsernameFormData = z.infer<typeof usernameFormSchema>;

export function OnboardingUsername() {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<UsernameFormData>({
    resolver: zodResolver(usernameFormSchema),
    mode: 'onChange',
  });

  const username = watch('username', '');
  const validation = useUsernameValidation(username);

  const onSubmit = async (data: UsernameFormData) => {
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
        toast({
          title: 'Success',
          description: 'Your username has been saved',
        });
        router.push('/onboarding?step=2');
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

  const isFormValid = validation.isValid && validation.isAvailable && !validation.isChecking;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <ProgressIndicator currentStep={1} totalSteps={3} />
          <div>
            <CardTitle className="text-2xl">{t('step1Title')}</CardTitle>
            <CardDescription className="mt-2">{t('step1Description')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <UsernameInput
              {...register('username')}
              value={username}
              onChange={(value) => {
                const event = { target: { value, name: 'username' } };
                register('username').onChange(event);
              }}
              isValid={validation.isValid}
              isAvailable={validation.isAvailable}
              error={validation.error}
              isChecking={validation.isChecking}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : t('continue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
