import { cn } from '@/utils/Helpers';

/**
 * Centered, horizontally-padded content column for marketing pages. Standardizes
 * the `mx-auto max-w-* px-4 sm:px-6` pattern so page width stays consistent in
 * one place. Adopted by the legal pages (terms/privacy); other marketing pages
 * can move onto it incrementally.
 */
const SIZES = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
} as const;

export const Container = (props: {
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}) => (
  <div className={cn('mx-auto w-full px-4 sm:px-6', SIZES[props.size ?? 'lg'], props.className)}>
    {props.children}
  </div>
);
