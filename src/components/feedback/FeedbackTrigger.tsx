'use client';

import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/Helpers';

import { FeedbackModal } from './FeedbackModal';

type FeedbackTriggerProps = {
  collapsed?: boolean;
  className?: string;
};

export const FeedbackTrigger = ({ ref, collapsed = false, className }: FeedbackTriggerProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const button = (
    <button
      ref={ref}
      onClick={() => setIsFeedbackOpen(true)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
        'text-slate-600 dark:text-slate-400',
        'transition-colors duration-200',
        'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        collapsed && 'justify-center px-2',
        className,
      )}
      aria-label="Send feedback"
    >
      <MessageSquare className="size-4 shrink-0 transition-colors group-hover:text-slate-900 dark:group-hover:text-slate-100" />
      {!collapsed && <span>Feedback</span>}
    </button>
  );

  return (
    <>
      {collapsed
        ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {button}
              </TooltipTrigger>
              <TooltipContent side="right">
                Feedback
              </TooltipContent>
            </Tooltip>
          )
        : button}

      <FeedbackModal open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
};

FeedbackTrigger.displayName = 'FeedbackTrigger';
