import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/chat/AppShell';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ThreadListSidebar } from '@/components/chat/ThreadListSidebar';
import { TitleBar } from '@/features/dashboard/TitleBar';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
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

export default async function ChatPage() {
  const t = await getTranslations('ChatPage');

  // AC #7.1, #7.2: Root /chat route shows empty state when no threadId
  return (
    <div className="flex h-full flex-col gap-6">
      <TitleBar
        title={t('title')}
        description={t('description')}
      />

      <div className="min-h-0 flex-1">
        <AppShell sidebar={<ThreadListSidebar />}>
          {/* Show ChatInterface with composer (ThreadPrimitive.Empty handles empty state) */}
          <ChatInterface />
        </AppShell>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
