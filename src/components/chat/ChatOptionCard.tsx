import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type ChatOptionCardProps = {
  title: string;
  description: string;
  features?: string;
  href: string;
  configured: boolean;
  icon: LucideIcon;
  setupMessage?: string;
  ctaLabel: string;
};

/**
 * ChatOptionCard Component
 *
 * Displays a chat implementation option with description and CTA.
 * Shows "Setup Required" badge when not configured.
 *
 * @param props - Component props
 * @param props.title - Card title (e.g., "Dify Chat")
 * @param props.description - Card description
 * @param props.features - Comma-separated feature list
 * @param props.href - Link destination
 * @param props.configured - Whether this chat option is configured
 * @param props.icon - Icon component to display
 * @param props.setupMessage - Message to show when not configured
 * @param props.ctaLabel - CTA button label
 */
export function ChatOptionCard({
  title,
  description,
  features,
  href,
  configured,
  icon: Icon,
  setupMessage,
  ctaLabel,
}: ChatOptionCardProps): ReactNode {
  const featureList = features?.split(',').map(f => f.trim());

  return (
    <Card className={`relative transition-all hover:shadow-lg ${!configured ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
            <Icon className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          {!configured && (
            <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
              Setup Required
            </Badge>
          )}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>

      {featureList && featureList.length > 0 && (
        <CardContent>
          <ul className="space-y-2">
            {featureList.map(feature => (
              <li key={feature} className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <span className="mr-2 size-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      )}

      <CardFooter className="flex flex-col gap-2">
        {configured
          ? (
              <Button asChild className="w-full">
                <Link href={href}>
                  {ctaLabel}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            )
          : (
              <div className="w-full text-center">
                <Button disabled className="w-full">
                  {ctaLabel}
                </Button>
                {setupMessage && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {setupMessage}
                  </p>
                )}
              </div>
            )}
      </CardFooter>
    </Card>
  );
}
