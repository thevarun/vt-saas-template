'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/libs/supabase/client';

const createProfileSchema = (t: ReturnType<typeof useTranslations<'UserProfile'>>) =>
  z.object({
    username: z
      .string()
      .min(3, t('validation_username_min'))
      .max(20, t('validation_username_max'))
      .regex(/^\w+$/, t('validation_username_format')),
    displayName: z
      .string()
      .min(1, t('validation_display_name_required'))
      .max(50, t('validation_display_name_max')),
  });

export default function UserProfilePage() {
  const t = useTranslations('UserProfile');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const profileSchema = createProfileSchema(t);
  type ProfileFormData = z.infer<typeof profileSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const username = watch('username');

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || '');
        setValue('username', user.user_metadata?.username || '');
        setValue('displayName', user.user_metadata?.display_name || user.user_metadata?.full_name || '');
      }

      setLoading(false);
    };

    loadUserData();
  }, [setValue]);

  useEffect(() => {
    if (!username || username.length < 3 || errors.username) {
      setUsernameAvailable(null);
      return;
    }

    const timeout = setTimeout(() => {
      setCheckingUsername(true);
      fetch('/api/profile/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
        .then(response => response.json())
        .then((data) => {
          setUsernameAvailable(data.available);
          setCheckingUsername(false);
        })
        .catch(() => {
          setUsernameAvailable(null);
          setCheckingUsername(false);
        });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [username, errors.username]);

  const onSubmit = async (data: ProfileFormData) => {
    if (usernameAvailable === false) {
      toast({
        title: t('error_title'),
        description: t('error_username_taken'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: t('success_title'),
        description: t('success_message'),
      });
    } catch {
      toast({
        title: t('error_title'),
        description: t('error_message'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast({
        title: t('delete_success_title'),
        description: t('delete_success_message'),
      });

      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(`/${locale}`);
    } catch {
      toast({
        title: t('error_title'),
        description: t('delete_error_message'),
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <User className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {t('title')}
            </h1>
            <p className="text-sm text-slate-500">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-slate-700">
                {t('email_label')}
              </label>
              <input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="flex h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 shadow-sm"
              />
              <p className="text-xs text-slate-500">{t('email_readonly_hint')}</p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none text-slate-700">
                {t('username_label')}
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder={t('username_placeholder')}
                  className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!errors.username}
                  disabled={saving}
                  {...register('username')}
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="size-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
              {!errors.username && username && username.length >= 3 && usernameAvailable !== null && (
                <p className={`text-sm ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {usernameAvailable ? t('username_available') : t('username_taken')}
                </p>
              )}
              <p className="text-xs text-slate-500">{t('username_hint')}</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium leading-none text-slate-700">
                {t('display_name_label')}
              </label>
              <input
                id="displayName"
                type="text"
                placeholder={t('display_name_placeholder')}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={!!errors.displayName}
                disabled={saving}
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving || checkingUsername || usernameAvailable === false}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving
                ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="-ml-1 mr-2 size-5 animate-spin" />
                      {t('saving')}
                    </span>
                  )
                : t('save_button')}
            </button>
          </form>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 opacity-80" />
      </div>

      {/* Danger Zone */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-xl">
        <div className="border-b border-red-100 bg-red-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-red-900">{t('danger_zone_title')}</h2>
          <p className="mt-1 text-sm text-red-700">{t('danger_zone_description')}</p>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-slate-900">{t('delete_account_title')}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('delete_account_description')}</p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="ml-4 shrink-0"
            >
              <Trash2 className="mr-2 size-4" />
              {t('delete_button')}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="size-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t('delete_dialog_title')}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {t('delete_dialog_message')}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('cancel_button')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleting
                    ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="-ml-1 mr-2 size-4 animate-spin" />
                          {t('deleting')}
                        </span>
                      )
                    : t('confirm_delete_button')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
