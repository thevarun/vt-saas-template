import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 pt-12">
      {/* Header */}
      <div className="flex items-center gap-3 py-2">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Notifications section */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
