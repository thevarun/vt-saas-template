import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/chat/AppShell';
import { ConversationListSidebar } from '@/components/chat/vercel/ConversationListSidebar';
import { VercelChatInterface } from '@/components/chat/vercel/VercelChatInterface';
import { getConversationById } from '@/libs/queries/vercelConversations';
import { getConversationMessages } from '@/libs/queries/vercelMessages';
import { createClient } from '@/libs/supabase/server';

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
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { locale, conversationId } = await props.params;

  // Verify the authenticated user owns this conversation
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/${locale}/sign-in`);
  }

  const { data: conversation } = await getConversationById(conversationId, user.id);
  if (!conversation) {
    return redirect(`/${locale}/chat/vercel`);
  }

  // Fetch messages server-side so they're available on first render
  const { data: messages } = await getConversationMessages(conversationId);

  const initialMessages = (messages ?? []).map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    parts: [{ type: 'text' as const, text: msg.content }],
  }));

  // AC #2, #3: Conversation view shows messages for specific conversation
  // AC #2: Sidebar highlights active conversation
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <AppShell sidebar={<ConversationListSidebar />}>
          <VercelChatInterface conversationId={conversationId} initialMessages={initialMessages} />
        </AppShell>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
