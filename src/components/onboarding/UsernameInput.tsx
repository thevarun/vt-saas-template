'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/Helpers';

type UsernameInputProps = {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  isAvailable: boolean | null;
  error: string | null;
  isChecking: boolean;
  name?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
};

export function UsernameInput({
  value,
  onChange,
  isValid,
  isAvailable,
  error,
  isChecking,
  name = 'username',
  onBlur,
}: UsernameInputProps) {
  const t = useTranslations('Onboarding');

  const showSuccess = isValid && isAvailable && !isChecking;
  const showError = error && !isChecking;

  return (
    <div className="w-full space-y-2">
      <Label
        htmlFor="username"
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {t('usernameLabel')}
      </Label>

      <div className="relative">
        <Input
          id="username"
          name={name}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toLowerCase())}
          onBlur={onBlur}
          placeholder={t('usernamePlaceholder')}
          className={cn(
            'py-3 pr-10 transition-all duration-200',
            isChecking && 'border-blue-500 focus-visible:ring-blue-500/20',
            showSuccess && 'border-green-500 focus-visible:ring-green-500/20',
            showError && 'border-red-500 focus-visible:ring-red-500/20',
          )}
          aria-invalid={!!showError}
          aria-describedby="username-helper"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {isChecking && (
            <Loader2 className="size-5 animate-spin text-blue-500" />
          )}
          {showSuccess && (
            <CheckCircle className="size-5 text-green-500" />
          )}
          {showError && (
            <XCircle className="size-5 text-red-500" />
          )}
        </div>
      </div>

      <div className="flex min-h-[20px] items-start justify-between text-xs">
        <p
          id="username-helper"
          className={cn(
            showError ? 'text-red-500' : 'text-muted-foreground',
          )}
        >
          {error
            ? (error === 'Username taken' ? t('usernameTaken') : t('usernameInvalid'))
            : isChecking
              ? t('usernameChecking')
              : t('usernameRequirements')}
        </p>

        {showSuccess && (
          <span className="font-medium text-green-600">
            {t('usernameAvailable')}
          </span>
        )}
      </div>
    </div>
  );
}
