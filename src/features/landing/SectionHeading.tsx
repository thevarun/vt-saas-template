import { cn } from '@/utils/Helpers';

/**
 * The eyebrow + title + description block shared by marketing sections. The
 * eyebrow uses the per-theme brand gradient tokens (`--gradient-*`), so it
 * follows the marketing theme. Renders nothing when no text is provided.
 */
export const SectionHeading = (props: {
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
}) => {
  if (!props.eyebrow && !props.title && !props.description) {
    return null;
  }

  return (
    <div className={cn('mx-auto mb-12 max-w-(--breakpoint-md) text-center', props.className)}>
      {props.eyebrow && (
        <div className="bg-linear-to-r from-(--gradient-from) via-(--gradient-via) to-(--gradient-to) bg-clip-text text-sm font-bold text-transparent">
          {props.eyebrow}
        </div>
      )}

      {props.title && (
        <h2 className="mt-1 text-3xl font-bold">{props.title}</h2>
      )}

      {props.description && (
        <div className="mt-2 text-lg text-muted-foreground">
          {props.description}
        </div>
      )}
    </div>
  );
};
