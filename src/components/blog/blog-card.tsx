import Link from 'next/link';

/**
 * Blog listing card, shared by the blog index and category pages. Cards are
 * equal-height within a grid row (`h-full` + `flex flex-col`, with the "Read
 * more" affordance pinned to the bottom via `mt-auto`) and lift slightly on
 * hover. Keyboard focus is handled by the global `a:focus-visible` outline
 * (see global.css); `rounded-lg` makes that outline follow the card's corners.
 */
export const BlogCard = (props: {
  href: string;
  title: string;
  description: string;
}) => (
  <Link
    href={props.href}
    className="group block h-full rounded-lg"
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
