import { Settings } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { NotificationsSection } from '@/components/settings/notifications-section';
import { requireAuthOrRedirect } from '@/libs/auth/auth-redirects';

export default async function SettingsPage() {
  const t = await getTranslations('Settings');
  await requireAuthOrRedirect('/settings');

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 pt-12">
      <div className="flex items-center gap-3 py-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
          <Settings className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('page_title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('page_subtitle')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <NotificationsSection />
      </div>
    </div>
  );
}
