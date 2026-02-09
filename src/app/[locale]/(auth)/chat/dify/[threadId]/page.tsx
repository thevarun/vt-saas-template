import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/chat/AppShell';
import { ThreadListSidebar } from '@/components/chat/ThreadListSidebar';
import { ThreadView } from '@/components/chat/ThreadView';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { createClient } from '@/libs/supabase/server';
import { getThreadById } from '@/libs/supabase/threads';

export async function generateMetadata(props: {
  params: Promise<{ locale: string; threadId: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Chat',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function ThreadPage(props: {
  params: Promise<{ locale: string; threadId: string }>;
}) {
  const { locale, threadId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ChatPage' });

  // Fetch thread data server-side
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const { data: thread, error } = await getThreadById(supabase, threadId);

  // AC #1.4: Handle 404 error if thread not found (redirect to /chat)
  if (error || !thread) {
    // Redirect to empty chat state (will show "thread not found" via query param)
    redirect(`/${locale}/chat?error=thread_not_found`);
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <TitleBar
        title={t('title')}
        description={t('description')}
      />

      <div className="min-h-0 flex-1">
        <AppShell sidebar={<ThreadListSidebar />}>
          <ThreadView thread={thread} />
        </AppShell>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
