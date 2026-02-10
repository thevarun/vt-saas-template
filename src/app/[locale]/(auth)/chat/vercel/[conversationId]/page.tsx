import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/chat/AppShell';
import { ConversationListSidebar } from '@/components/chat/vercel/ConversationListSidebar';
import { VercelChatInterface } from '@/components/chat/vercel/VercelChatInterface';
import { TitleBar } from '@/features/dashboard/TitleBar';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Chat',
  });

  return {
    title: t('vercel_meta_title'),
    description: t('vercel_meta_description'),
  };
}

export default async function VercelConversationPage(props: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await props.params;
  const t = await getTranslations('Chat');

  // AC #2, #3: Conversation view shows messages for specific conversation
  // AC #2: Sidebar highlights active conversation
  return (
    <div className="flex h-full flex-col gap-6">
      <TitleBar
        title={t('vercel_title')}
        description={t('vercel_description')}
      />

      <div className="min-h-0 flex-1">
        <AppShell sidebar={<ConversationListSidebar />}>
          {/* Pass conversationId to load specific conversation */}
          <VercelChatInterface conversationId={conversationId} />
        </AppShell>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
