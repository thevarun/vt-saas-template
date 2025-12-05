import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { MessageState } from '@/features/dashboard/MessageState';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { createClient } from '@/libs/supabase/server';

const DashboardIndexPage = async () => {
  const t = await getTranslations('DashboardIndex');

  // AC #5: Fetch user data from Supabase
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  // Extract name or email for personalized greeting
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* AC #5: Personalized greeting with user email/name */}
      <div className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold">
          {t('welcome_message', { name: displayName })}
        </h2>
        <p className="text-muted-foreground">
          {user?.email && t('user_email', { email: user.email })}
        </p>
      </div>

      <MessageState
        icon={(
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M0 0h24v24H0z" stroke="none" />
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3M12 12l8-4.5M12 12v9M12 12L4 7.5" />
          </svg>
        )}
        title={t('message_state_title')}
        description={t.rich('message_state_description', {
          code: chunks => (
            <code className="bg-secondary text-secondary-foreground">
              {chunks}
            </code>
          ),
        })}
        button={null}
      />
    </>
  );
};

export default DashboardIndexPage;
