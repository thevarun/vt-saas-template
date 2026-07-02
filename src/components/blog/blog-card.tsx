import Link from 'next/link';

/**
 * Blog listing card, shared by the blog index and category pages. Cards are
 * equal-height within a grid row (`h-full` + `flex flex-col`, with the "Read
 * more" affordance pinned to the bottom via `mt-auto`), lift slightly on hover,
 * and show a keyboard focus ring on the link.
 */
export const BlogCard = (props: {
  href: string;
  title: string;
  description: string;
}) => (
  <Link
    href={props.href}
    className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <article className="flex h-full flex-col rounded-lg border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
      <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
        {props.title}
      </h3>
      <p className="line-clamp-3 text-sm text-muted-foreground">
        {props.description}
      </p>
      <div className="mt-auto pt-4 text-sm font-medium text-primary">
        Read more &rarr;
      </div>
    </article>
  </Link>
);
