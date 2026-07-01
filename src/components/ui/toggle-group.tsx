'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { toggleVariants } from '@/components/ui/toggle-variants';
import { cn } from '@/utils/Helpers';

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: 'default',
  variant: 'default',
});

type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
  & VariantProps<typeof toggleVariants>;

const ToggleGroup = ({ ref, className, variant, size, children, ...props }: ToggleGroupProps & { ref?: React.RefObject<React.ElementRef<typeof ToggleGroupPrimitive.Root> | null> }) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('flex items-center justify-center gap-1', className)}
    {...props}
  >
    <ToggleGroupContext value={{ variant, size }}>
      {children}
    </ToggleGroupContext>
  </ToggleGroupPrimitive.Root>
);

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

type ToggleGroupItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
  & VariantProps<typeof toggleVariants>;

const ToggleGroupItem = ({ ref, className, children, variant, size, ...props }: ToggleGroupItemProps & { ref?: React.RefObject<React.ElementRef<typeof ToggleGroupPrimitive.Item> | null> }) => {
  const context = React.use(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
};

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
