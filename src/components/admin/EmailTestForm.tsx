'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { parseApiError } from '@/libs/api/client';

const emailFormSchema = z.object({
  template: z.enum(['welcome', 'password-reset', 'verify-email']),
  email: z.string().email(),
  data: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export function EmailTestForm() {
  const t = useTranslations('Admin.Email');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      template: 'welcome',
      email: '',
      data: '',
    },
  });

  async function onSubmit(values: EmailFormValues) {
    setIsLoading(true);
    setError(null);

    // Parse data field as JSON if provided
    let parsedData: Record<string, unknown> | undefined;
    if (values.data && values.data.trim()) {
      try {
        parsedData = JSON.parse(values.data);
      } catch {
        setError(t('invalidJson'));
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: values.template,
          email: values.email,
          data: parsedData,
        }),
      });

      if (!response.ok) {
        const parsed = await parseApiError(response);
        setError(parsed.message);
        return;
      }

      toast({
        title: t('successTitle'),
        description: t('successMessage', { email: values.email }),
      });

      form.reset();
    } catch {
      setError(t('errorTitle'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('templateLabel')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="template-select">
                    <SelectValue placeholder={t('templatePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="welcome">{t('templates.welcome')}</SelectItem>
                  <SelectItem value="password-reset">{t('templates.passwordReset')}</SelectItem>
                  <SelectItem value="verify-email">{t('templates.verifyEmail')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('templateDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field: { ref: _ref, ...field } }) => (
            <FormItem>
              <FormLabel>{t('emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  data-testid="email-input"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('emailDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data"
          render={({ field: { ref: _ref, ...field } }) => (
            <FormItem>
              <FormLabel>{t('dataLabel')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('dataPlaceholder')}
                  rows={4}
                  data-testid="data-textarea"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('dataDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" data-testid="error-message">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isLoading} data-testid="submit-button">
          {isLoading ? t('sendingButton') : t('sendButton')}
        </Button>
      </form>
    </Form>
  );
}
