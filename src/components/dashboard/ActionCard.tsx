'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

type ActionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  variant?: 'primary' | 'secondary';
  index: number;
  completed?: boolean;
};

export function ActionCard({
  icon: Icon,
  title,
  description,
  ctaText,
  href,
  variant = 'secondary',
  index,
  completed = false,
}: ActionCardProps) {
  const router = useRouter();

  const handleAction = () => {
    if (!completed) {
      router.push(href);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
      }}
      className={`flex h-full flex-col rounded-xl border p-6 shadow-sm transition-colors ${
        completed
          ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`rounded-lg p-3 ${
            completed
              ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>

      <div className="mb-6 flex-1">
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-end">
        <Button
          variant={variant === 'primary' ? 'default' : 'outline'}
          onClick={handleAction}
          disabled={completed}
          className="w-full sm:w-auto"
        >
          {ctaText}
        </Button>
      </div>
    </motion.div>
  );
}
