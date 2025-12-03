import { getTranslations } from 'next-intl/server';

import { ChatInterface } from '@/components/chat/ChatInterface';
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

  return (
    <div className="space-y-6">
      <TitleBar
        title={t('title')}
        description={t('description')}
      />

      <div className="min-h-[70vh]">
        <ChatInterface className="h-full" />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
