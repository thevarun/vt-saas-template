'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Terminal } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { createClient } from '@/libs/supabase/client';

const formSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof formSchema>;

type Mode = 'login' | 'signup';

export default function DevSignInPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: 'test@test.com',
      password: 'password',
    },
  });

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (error) {
          setServerError(error.message);
          setLoading(false);
          return;
        }

        setSuccessMessage(
          `Account created for ${data.email}. Check email to verify, or sign in directly if email confirmation is disabled.`,
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setServerError(error.message);
        setLoading(false);
        return;
      }

      router.push(`/${locale}/dashboard`);
    } catch {
      setServerError('Network error');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'signup' : 'login'));
    setServerError(null);
    setSuccessMessage(null);
  };

  const isSignUp = mode === 'signup';

  return (
    <div className="w-full">
      {/* Dev badge */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
        <Terminal className="size-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-700">
          Development Only
        </span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
        {isSignUp ? 'Dev Sign Up' : 'Dev Sign In'}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isSignUp
          ? 'Create a new account for development and testing.'
          : 'Email/password login for development and testing.'}
        {' '}
        Not available in production.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dev-email">Email</Label>
          <input
            id="dev-email"
            type="email"
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dev-password">Password</Label>
          <PasswordInput
            id="dev-password"
            className="h-11"
            disabled={loading}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading
            ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="-ml-1 mr-2 size-5 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              )
            : isSignUp
              ? (
                  'Create Account'
                )
              : (
                  'Sign In'
                )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account?' : 'Need a new account?'}
        {' '}
        <button
          type="button"
          onClick={toggleMode}
          className="font-semibold text-primary hover:text-primary/80 hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Create Account'}
        </button>
      </p>
    </div>
  );
}
