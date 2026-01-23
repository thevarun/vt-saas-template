import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { OnboardingUsername } from '@/components/onboarding/OnboardingUsername';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userProfiles } from '@/models/Schema';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Onboarding');

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/sign-in');
  }

  // Check if onboarding is already completed
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (profile[0]?.onboardingCompletedAt) {
    redirect('/dashboard');
  }

  // For now, we only have Step 1, so always show it
  // In future stories, we'll check onboardingStep and redirect accordingly

  return <OnboardingUsername />;
}
