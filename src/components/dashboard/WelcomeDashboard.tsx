'use client';

import { motion } from 'framer-motion';
import { Compass, MessageSquare, Sparkles, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ActionCard } from './ActionCard';

type WelcomeDashboardProps = {
  userName: string;
};

export function WelcomeDashboard({ userName }: WelcomeDashboardProps) {
  const t = useTranslations('Dashboard');

  const actions = [
    {
      icon: MessageSquare,
      title: t('actionStartChat'),
      description: t('actionStartChatDesc'),
      ctaText: t('actionButtonLabel'),
      href: '/chat',
      variant: 'primary' as const,
    },
    {
      icon: User,
      title: t('actionCompleteProfile'),
      description: t('actionCompleteProfileDesc'),
      ctaText: t('actionButtonLabel'),
      href: '/dashboard/user-profile',
      variant: 'secondary' as const,
    },
    {
      icon: Compass,
      title: t('actionExploreFeatures'),
      description: t('actionExploreFeaturesDesc'),
      ctaText: t('actionButtonLabel'),
      href: '/dashboard',
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            {t('welcomeTitle', { name: userName })}
          </h1>
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{
              duration: 2.5,
              ease: 'easeInOut',
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
              repeat: Infinity,
              repeatDelay: 5,
            }}
            className="inline-block origin-bottom-right text-3xl md:text-4xl"
          >
            👋
          </motion.span>
        </div>
        <p className="max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          {t('welcomeDescription')}
        </p>
      </motion.header>

      {/* Action Cards Grid */}
      <section aria-label={t('gettingStartedTitle')}>
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t('gettingStartedTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => (
            <ActionCard key={action.title} index={index} {...action} />
          ))}
        </div>
      </section>

      {/* Recent Activity - Empty State */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="space-y-6"
        aria-labelledby="activity-heading"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
          <h2
            id="activity-heading"
            className="text-xl font-semibold text-slate-900 dark:text-slate-100"
          >
            {t('recentActivityTitle')}
          </h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            {t('viewAll')}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700">
            <Sparkles className="text-slate-400 dark:text-slate-500" size={32} />
          </div>
          <h3 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">
            {t('noActivityTitle')}
          </h3>
          <p className="mx-auto max-w-sm text-slate-500 dark:text-slate-400">
            {t('noActivityDescription')}
          </p>
        </div>
      </motion.section>
    </div>
  );
}
