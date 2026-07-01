import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/utils/Helpers';

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** Optional right-aligned action (e.g., a button) */
  action?: ReactNode;
  /** Extra classes for the icon (e.g., rotation) */
  iconClassName?: string;
  /** Optional content below the title row (e.g., status badges) */
  children?: ReactNode;
};

export function PageHeader({ icon: Icon, title, description, action, iconClassName, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2 py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className={cn('size-5 text-primary', iconClassName)} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {action && <div className="flex justify-center sm:block sm:shrink-0">{action}</div>}
      </div>
      {children}
    </header>
  );
}
