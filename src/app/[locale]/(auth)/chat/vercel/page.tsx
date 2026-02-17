import { AlertCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AppShell } from '@/components/chat/AppShell';
import { ConversationListSidebar } from '@/components/chat/vercel/ConversationListSidebar';
import { VercelChatInterface } from '@/components/chat/vercel/VercelChatInterface';
import { getChatConfig } from '@/utils/chatConfig';

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

export default async function VercelChatPage() {
  const config = getChatConfig();

  if (!config.vercel.configured) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="mx-auto max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-900 dark:bg-yellow-950">
          <AlertCircle className="mx-auto mb-4 size-12 text-yellow-600 dark:text-yellow-400" />
          <h2 className="mb-2 text-xl font-semibold text-yellow-900 dark:text-yellow-100">
            Vercel AI SDK Configuration Required
          </h2>
          <p className="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
            The Vercel AI SDK chat feature requires configuration. Please set the following environment variables:
          </p>
          <div className="mb-4 rounded bg-yellow-100 p-3 text-left font-mono text-xs text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
            <div>OPENAI_API_KEY=sk-...</div>
            <div># or</div>
            <div>ANTHROPIC_API_KEY=sk-ant-...</div>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Get your API key from
            {' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              OpenAI
            </a>
            {' '}
            or
            {' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Anthropic
            </a>
            . See
            {' '}
            <code className="rounded bg-yellow-200 px-1 py-0.5 dark:bg-yellow-800">
              .env.example
            </code>
            {' '}
            for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <AppShell sidebar={<ConversationListSidebar />}>
          <VercelChatInterface />
        </AppShell>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
