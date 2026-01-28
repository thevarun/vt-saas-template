import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { OnboardingFeatureTour } from '@/components/onboarding/OnboardingFeatureTour';
import { OnboardingPreferences } from '@/components/onboarding/OnboardingPreferences';
import { OnboardingUsername } from '@/components/onboarding/OnboardingUsername';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { userPreferences } from '@/models/Schema';

type Props = {
  searchParams: Promise<{ step?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Onboarding');

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

/**
 * Generate a default placeholder username from user ID
 * Format: user_XXXXXX (first 6 chars of UUID without hyphens)
 */
function generateDefaultUsername(userId: string): string {
  const cleanId = userId.replace(/-/g, '').substring(0, 6).toLowerCase();
  return `user_${cleanId}`;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams;
  const step = params.step ? Number.parseInt(params.step, 10) : 1;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Verify authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/sign-in');
  }

  // Fetch existing user preferences (if any)
  const existingPreferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  const preferences = existingPreferences[0];

  // Prepare data to pass to components
  const defaultUsername = generateDefaultUsername(user.id);
  const initialData = {
    username: preferences?.username ?? defaultUsername,
    displayName: preferences?.displayName ?? '',
    emailNotifications: preferences?.emailNotifications ?? true,
    language: preferences?.language ?? 'en',
    isNewUser: !preferences,
  };

  // Validate step (1-3 only)
  const validStep = Math.min(Math.max(step, 1), 3);

  // Render appropriate component with initial data
  switch (validStep) {
    case 3:
      return <OnboardingPreferences initialData={initialData} />;
    case 2:
      return <OnboardingFeatureTour />;
    case 1:
    default:
      return <OnboardingUsername initialData={initialData} />;
  }
}
