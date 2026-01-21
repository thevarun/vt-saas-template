'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { createClient } from '@/libs/supabase/client';

const createSignUpSchema = (t: ReturnType<typeof useTranslations<'SignUp'>>) =>
  z.object({
    email: z.string().email(t('validation_email_invalid')),
    password: z
      .string()
      .min(8, t('validation_password_min'))
      .regex(/[A-Z]/, t('validation_password_uppercase'))
      .regex(/[a-z]/, t('validation_password_lowercase'))
      .regex(/\d/, t('validation_password_number')),
  });

export default function SignUpPage() {
  const t = useTranslations('SignUp');
  const params = useParams();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const signUpSchema = createSignUpSchema(t);
  type SignUpFormData = z.infer<typeof signUpSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  });

  const email = watch('email');

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Map Supabase errors to user-friendly messages
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          setServerError(t('error_email_exists'));
        } else {
          setServerError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setServerError(t('error_unexpected'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="absolute left-4 top-4 flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900 sm:left-8 sm:top-8"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          {t('back_to_home')}
        </Link>

        <div className="w-full max-w-md">
          <Card className="bg-white/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-8 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {t('success_title')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {t('success_subtitle')}
              </CardDescription>
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                {email}
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-sm text-gray-600">
                {t('success_message')}
              </p>
              <Link
                href={`/${locale}/sign-in`}
                className="inline-block rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg"
              >
                {t('success_button')}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}`}
        className="absolute left-4 top-4 flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-900 sm:left-8 sm:top-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 size-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        {t('back_to_home')}
      </Link>

      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 shrink-0 text-red-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{serverError}</p>
                    {serverError === t('error_email_exists') && (
                      <Link
                        href={`/${locale}/sign-in`}
                        className="mt-1 text-sm font-semibold text-red-900 underline hover:text-red-700"
                      >
                        {t('error_email_exists_action')}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('email_label')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder={t('email_placeholder')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('password_label')}
                  </label>
                  <PasswordInput
                    id="password"
                    placeholder={t('password_placeholder')}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <div className="text-xs text-gray-600">
                    <p className="font-semibold">{t('password_requirements')}</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>{t('password_min_chars')}</li>
                      <li>{t('password_uppercase')}</li>
                      <li>{t('password_lowercase')}</li>
                      <li>{t('password_number')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t('submit_loading') : t('submit_button')}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-gray-500">
                    {t('already_have_account')}
                  </span>
                </div>
              </div>

              <Link
                href={`/${locale}/sign-in`}
                className="block w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-center font-semibold text-gray-700 transition hover:border-slate-900 hover:bg-slate-50"
              >
                {t('sign_in_link')}
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
