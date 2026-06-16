'use client';

import { BellRing, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useUpdateUserPreferences,
  useUserPreferences,
} from '@/libs/hooks/use-user-preferences';

export function NotificationsSection() {
  const t = useTranslations('Settings');
  const { data: prefs, isLoading } = useUserPreferences();
  const updatePrefs = useUpdateUserPreferences();

  const [emailNotifications, setEmailNotifications] = useState(true);

  // Sync form state once server data loads.
  useEffect(() => {
    if (prefs) {
      setEmailNotifications(prefs.emailNotifications);
    }
  }, [prefs]);

  const dirty = !!prefs && emailNotifications !== prefs.emailNotifications;

  const handleSave = async () => {
    try {
      await updatePrefs.mutateAsync({ emailNotifications });
      toast.success(t('notifications_saved_title'), {
        description: t('notifications_saved_toast'),
      });
    } catch (err) {
      toast.error(t('notifications_error_title'), {
        description: err instanceof Error ? err.message : t('notifications_error_generic'),
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <BellRing className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          {t('notifications_title')}
        </h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {t('notifications_description')}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-background/40 p-4 transition-colors hover:bg-accent/40">
          <Label
            htmlFor="email-notifications"
            className="cursor-pointer text-sm font-medium text-foreground"
          >
            {t('email_notifications')}
          </Label>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            disabled={isLoading || updatePrefs.isPending}
            onCheckedChange={setEmailNotifications}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isLoading || updatePrefs.isPending}
        >
          {updatePrefs.isPending
            ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('saving')}
                </>
              )
            : t('save_notifications')}
        </Button>
      </div>
    </div>
  );
}
