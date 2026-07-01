'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/utils/Helpers';

type UnderTheHoodProps = {
  lines: string[];
  label: string;
  className?: string;
};

export function UnderTheHood({ lines, label, className }: UnderTheHoodProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ChevronDown
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
        />
        {label}
        {' '}
        (
        {lines.length}
        )
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <ul className="space-y-1.5 border-l border-border pl-4">
          {lines.map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key -- lines are raw LLM output and can repeat (e.g. two identical dependency bumps); the index keeps every entry rendered
            <li key={i} className="text-sm text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
