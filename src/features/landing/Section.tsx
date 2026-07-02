import { SectionHeading } from '@/features/landing/SectionHeading';
import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  id?: string;
}) => (
  <div id={props.id} className={cn('px-3 py-16', props.className)}>
    <SectionHeading
      eyebrow={props.subtitle}
      title={props.title}
      description={props.description}
    />

    <div className="mx-auto max-w-(--breakpoint-lg)">{props.children}</div>
  </div>
);
