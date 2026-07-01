import { Skeleton } from '@/components/ui/skeleton';

export default function BlogIndexLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <Skeleton className="mb-6 h-5 w-24" />

      {/* Page header */}
      <header className="mb-12 max-w-2xl space-y-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-6 w-full max-w-lg" />
      </header>

      {/* Category sections */}
      <div className="space-y-16">
        {Array.from({ length: 2 }).map((_, sectionIdx) => (
          // eslint-disable-next-line react/no-array-index-key -- static placeholder list; index is a stable key
          <section key={sectionIdx}>
            <div className="mb-6 flex items-baseline justify-between">
              <div className="max-w-2xl space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-80" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key -- static placeholder list; index is a stable key
                  key={i}
                  className="space-y-3 rounded-lg border border-border p-6"
                >
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="mt-4">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
