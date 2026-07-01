import { Skeleton } from '@/components/ui/skeleton';

export default function BlogArticleLoading() {
  return (
    <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
      {/* Back link */}
      <Skeleton className="mb-6 h-5 w-32" />

      {/* Article header */}
      <header className="mb-10 space-y-4">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </header>

      {/* Article body — paragraphs */}
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, paraIdx) => (
          // eslint-disable-next-line react/no-array-index-key -- static placeholder list; index is a stable key
          <div key={paraIdx} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[78%]" />
          </div>
        ))}
      </div>

      {/* Related posts */}
      <section className="mt-16 space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key -- static placeholder list; index is a stable key
              key={i}
              className="space-y-3 rounded-lg border border-border p-6"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
