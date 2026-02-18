import { MessageSquare, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ChatOptionCard } from '@/components/chat/ChatOptionCard';

/**
 * Chat Selection Page
 *
 * Allows users to choose between different chat implementations:
 * - Dify Chat: Simple, managed chat with minimal setup
 * - Vercel AI SDK Chat: Full control with conversation management
 *
 * Only configured options are shown. If neither is configured,
 * displays setup instructions.
 */
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'ChatSelection',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function ChatPage() {
  const t = await getTranslations('ChatSelection');

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 dark:bg-slate-950 md:p-8 lg:p-12">
      <div className="mx-auto max-w-(--breakpoint-xl)">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Chat Options Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Dify Chat Option */}
          <ChatOptionCard
            title={t('dify_title')}
            description={t('dify_description')}
            features={t('dify_features')}
            href="/chat/dify"
            configured={true}
            icon={MessageSquare}
            setupMessage={t('setup_required_description')}
            ctaLabel={t('get_started')}
          />

          {/* Vercel AI SDK Chat Option */}
          <ChatOptionCard
            title={t('vercel_title')}
            description={t('vercel_description')}
            features={t('vercel_features')}
            href="/chat/vercel"
            configured={true}
            icon={Sparkles}
            setupMessage={t('setup_required_description')}
            ctaLabel={t('get_started')}
          />
        </div>
      </div>
    </div>
  );
}
