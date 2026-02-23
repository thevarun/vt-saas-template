import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { AccessDeniedToast } from '@/components/auth/AccessDeniedToast';
import { VerificationToast } from '@/components/auth/VerificationToast';
import { WelcomeDashboard } from '@/components/dashboard/WelcomeDashboard';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

const DashboardIndexPage = async () => {
  const locale = await getLocale();

  // Fetch user data from Supabase
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  // Auto-create default preferences for new users (idempotent upsert)
  if (user) {
    await db.insert(userPreferences)
      .values({
        userId: user.id,
        emailNotifications: true,
        language: locale as 'en' | 'hi' | 'bn',
      })
      .onConflictDoNothing({ target: userPreferences.userId });
  }

  // Extract name or email for personalized greeting
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Always show the WelcomeDashboard with MagicPatterns design
  return (
    <>
      <Suspense fallback={null}>
        <AccessDeniedToast />
      </Suspense>
      <VerificationToast />
      <WelcomeDashboard userName={displayName} />
    </>
  );
};

export default DashboardIndexPage;
