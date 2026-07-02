import { cn } from '@/utils/Helpers';

export const Background = (props: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('w-full bg-secondary text-secondary-foreground', props.className)}>
    {props.children}
  </div>
);
