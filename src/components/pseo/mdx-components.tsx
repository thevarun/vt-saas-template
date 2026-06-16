/* eslint-disable react-refresh/only-export-components -- MDX registry intentionally colocates the article components with the single `mdxComponents` map that next-mdx-remote requires */
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/Helpers';

type CtaProps = {
  /** Button label. Required so each article picks its own CTA copy. */
  label: string;
  /** Destination path. Defaults to the sign-up page. */
  href?: string;
};

/**
 * Inline CTA for articles. Links to a destination of the article's choosing
 * (defaults to the sign-up page). Each product can point this anywhere —
 * pricing, a feature page, an external link, etc.
 */
function Cta({ label, href = '/sign-up' }: CtaProps) {
  return (
    <div className="not-prose my-8 flex justify-center">
      <Button asChild size="lg" className="rounded-full px-6">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}

type CalloutVariant = 'info' | 'warn' | 'tip';

type CalloutProps = {
  variant?: CalloutVariant;
  children: ReactNode;
};

const calloutStyles: Record<CalloutVariant, { container: string; icon: ReactNode }> = {
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100',
    icon: <Info className="h-5 w-5 shrink-0" />,
  },
  warn: {
    container: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
    icon: <AlertTriangle className="h-5 w-5 shrink-0" />,
  },
  tip: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    icon: <Lightbulb className="h-5 w-5 shrink-0" />,
  },
};

function Callout({ variant = 'info', children }: CalloutProps) {
  const style = calloutStyles[variant];
  return (
    <aside
      className={cn(
        'not-prose my-6 flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed',
        style.container,
      )}
    >
      <span className="mt-0.5">{style.icon}</span>
      <div className="[&>p]:m-0">{children}</div>
    </aside>
  );
}

type ComparisonTableProps = {
  children: ReactNode;
};

function ComparisonTable({ children }: ComparisonTableProps) {
  return (
    <div className="my-8 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

/**
 * MDX components map passed to <MDXRemote>. next-mdx-remote does not support
 * `import` / `export` inside .mdx files, so all custom components used in
 * articles must be registered here.
 */
export const mdxComponents = {
  Cta,
  Callout,
  ComparisonTable,
};
