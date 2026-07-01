import { cn } from '@/utils/Helpers';

type LegalSection = {
  id: string;
  label: string;
};

type LegalTableOfContentsProps = {
  sections: LegalSection[];
  className?: string;
  title?: string;
};

/**
 * "On this page" anchor navigation for legal pages (privacy, terms).
 * Server component — plain anchor links, no client JS. Wrapped in `not-prose`
 * so it renders consistently even when placed alongside Tailwind `prose` content.
 */
export function LegalTableOfContents({
  sections,
  className,
  title = 'On this page',
}: LegalTableOfContentsProps) {
  return (
    <nav
      aria-label={title}
      className={cn(
        'not-prose rounded-xl border border-border bg-muted/30 p-5 sm:p-6',
        className,
      )}
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ol className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group flex items-baseline gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground/60 transition-colors group-hover:text-foreground/70">
                {index + 1}
              </span>
              <span>{section.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
