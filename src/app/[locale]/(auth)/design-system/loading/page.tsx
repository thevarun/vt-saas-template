'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { LoadingCard } from '@/components/ui/loading-card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

/**
 * Loading States Showcase Page
 * Displays all loading patterns and components for the design system
 */
export default function LoadingStatesPage() {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 2000);
  };

  return (
    <div className="container mx-auto max-w-5xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Loader2 className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Loading States Pattern Library
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Skeleton loaders, spinners, and loading patterns
            </p>
          </div>
        </div>
      </div>

      {/* Skeleton Variants Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Skeleton Variants
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Content placeholders that match the shape of loaded content
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Text Skeleton */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Text Skeleton
            </h3>
            <div className="space-y-2">
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-3/4" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Skeleton variant="text" className="h-4 w-full" />`}
            </pre>
          </div>

          {/* Card Skeleton */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Card Skeleton
            </h3>
            <Skeleton variant="card" className="h-32 w-full" />
            <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Skeleton variant="card" className="h-32 w-full" />`}
            </pre>
          </div>

          {/* Avatar Skeleton */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Avatar Skeleton
            </h3>
            <div className="flex gap-4">
              <Skeleton variant="avatar" className="size-10" />
              <Skeleton variant="avatar" className="size-12" />
              <Skeleton variant="avatar" className="size-16" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Skeleton variant="avatar" className="size-12" />`}
            </pre>
          </div>

          {/* Button Skeleton */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Button Skeleton
            </h3>
            <Skeleton variant="button" className="w-24" />
            <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Skeleton variant="button" className="w-24" />`}
            </pre>
          </div>

          {/* Table Row Skeleton */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Table Row Skeleton
            </h3>
            <div className="space-y-3">
              <Skeleton variant="table-row" />
              <Skeleton variant="table-row" />
              <Skeleton variant="table-row" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Skeleton variant="table-row" />`}
            </pre>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Spinner Sizes Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Spinner Sizes
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Loading indicators for actions and page loads
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Small Spinner */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Small (sm)
            </h3>
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              16px - For inline text, small buttons
            </p>
            <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Spinner size="sm" />`}
            </pre>
          </div>

          {/* Medium Spinner */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Medium (md) - Default
            </h3>
            <div className="flex items-center justify-center py-4">
              <Spinner size="md" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              24px - For buttons, inline loading
            </p>
            <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Spinner size="md" />`}
            </pre>
          </div>

          {/* Large Spinner */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Large (lg)
            </h3>
            <div className="flex items-center justify-center py-4">
              <Spinner size="lg" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              48px - For full-page loading
            </p>
            <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
              {`<Spinner size="lg" />`}
            </pre>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* LoadingCard Component */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          LoadingCard Component
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Composite loading placeholder for card-based content
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>

        <pre className="mt-6 overflow-x-auto rounded bg-slate-100 p-4 text-xs dark:bg-slate-900">
          {`<LoadingCard />

// Multiple cards
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {Array.from({ length: 6 }).map((_, i) => (
    <LoadingCard key={i} />
  ))}
</div>`}
        </pre>
      </section>

      <Separator className="my-8" />

      {/* Button Loading State */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Button Loading State
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Interactive button with loading spinner
        </p>

        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap gap-4">
            <Button disabled={isButtonLoading} onClick={handleButtonClick}>
              {isButtonLoading
                ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  )
                : (
                    'Click Me'
                  )}
            </Button>

            <Button disabled variant="secondary">
              <Spinner size="sm" className="mr-2" />
              Saving...
            </Button>

            <Button disabled variant="outline">
              <Spinner size="sm" className="mr-2" />
              Processing...
            </Button>
          </div>

          <pre className="overflow-x-auto rounded bg-slate-100 p-4 text-xs dark:bg-slate-900">
            {`<Button disabled={isLoading} onClick={handleAction}>
  {isLoading ? (
    <>
      <Spinner size="sm" className="mr-2" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>`}
          </pre>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Full-Page Loading */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Full-Page Loading
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Centered spinner for page-level loading states
        </p>

        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <Spinner size="lg" />
        </div>

        <pre className="mt-6 overflow-x-auto rounded bg-slate-100 p-4 text-xs dark:bg-slate-900">
          {`<div className="flex min-h-screen items-center justify-center">
  <Spinner size="lg" />
</div>

// With message
<div className="flex min-h-screen flex-col items-center justify-center gap-4">
  <Spinner size="lg" />
  <p className="text-sm text-muted-foreground">Loading content...</p>
</div>`}
        </pre>
      </section>

      <Separator className="my-8" />

      {/* Usage Guidelines */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Usage Guidelines
        </h2>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              Skeleton Loaders
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use skeletons when loading content that has a known structure.
              Match the skeleton shape to the actual content for minimal layout
              shift.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              Spinners
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use spinners for actions, form submissions, or when content
              structure is unknown. Choose size based on context: sm for
              buttons, md for inline, lg for pages.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              Loading Cards
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use LoadingCard for card-based layouts. Display the same number of
              loading cards as you expect to render for consistent UX.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              Performance Tips
            </h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>Minimize layout shift by matching skeleton dimensions</li>
              <li>Use CSS animations (not JavaScript) for smooth performance</li>
              <li>Disable buttons during loading to prevent double-submission</li>
              <li>Show timeout messages if loading exceeds 3 seconds</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
