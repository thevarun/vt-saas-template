'use client';

import { Check, Loader2, X } from 'lucide-react';
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
    <div className="space-y-2">
      <Label htmlFor="username">{t('usernameLabel')}</Label>
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
            'pr-10',
            showSuccess && 'border-green-500 focus-visible:ring-green-500',
            showError && 'border-red-500 focus-visible:ring-red-500',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          )}
          {showSuccess && (
            <Check className="size-5 text-green-500" />
          )}
          {showError && (
            <X className="size-5 text-red-500" />
          )}
        </div>
      </div>
      {isChecking && (
        <p className="text-sm text-muted-foreground">
          {t('usernameChecking')}
        </p>
      )}
      {showSuccess && (
        <p className="text-sm text-green-600">
          {t('usernameAvailable')}
        </p>
      )}
      {showError && (
        <p className="text-sm text-red-600">
          {error === 'Username taken' ? t('usernameTaken') : t('usernameInvalid')}
        </p>
      )}
    </div>
  );
}
