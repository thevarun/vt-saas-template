import { Skeleton } from '@/components/ui/skeleton';

export default function BlogCategoryLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <Skeleton className="mb-4 h-5 w-40" />

      {/* Category header */}
      <header className="mb-8 max-w-2xl space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-full max-w-md" />
      </header>

      {/* Article grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
    </div>
  );
}
