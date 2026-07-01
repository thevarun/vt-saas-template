'use client';

import * as TogglePrimitive from '@radix-ui/react-toggle';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { toggleVariants } from '@/components/ui/toggle-variants';
import { cn } from '@/utils/Helpers';

const Toggle = ({ ref, className, variant, size, ...props }: React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
  & VariantProps<typeof toggleVariants> & { ref?: React.RefObject<React.ElementRef<typeof TogglePrimitive.Root> | null> }) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
);

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
