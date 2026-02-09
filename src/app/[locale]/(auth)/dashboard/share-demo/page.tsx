import { ShareWidget } from '@/components/share';

export default function ShareDemoPage() {
  const exampleUrl = 'https://example.com/awesome-article';
  const exampleTitle = 'Check out this awesome article!';
  const exampleDescription = 'This is an amazing article about building SaaS products';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ShareWidget Demo</h1>
          <p className="mt-2 text-muted-foreground">
            Social sharing component with three variants
          </p>
        </div>

        {/* Inline Variant */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Inline
            </span>
            <h2 className="mt-3 text-xl font-semibold">Inline Variant</h2>
            <p className="text-sm text-muted-foreground">
              Horizontal row with icon + label. Great for article footers or share sections.
            </p>
          </div>

          <div className="rounded-xl bg-muted p-6">
            <ShareWidget
              url={exampleUrl}
              title={exampleTitle}
              description={exampleDescription}
              variant="inline"
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <code className="font-mono text-xs text-muted-foreground">
              {`<ShareWidget url="..." title="..." variant="inline" />`}
            </code>
          </div>
        </section>

        {/* Popup Variant */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <span className="inline-block rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Popup
            </span>
            <h2 className="mt-3 text-xl font-semibold">Popup Variant</h2>
            <p className="text-sm text-muted-foreground">
              Expandable menu triggered by share icon. Perfect for toolbars or compact UIs.
            </p>
          </div>

          <div className="rounded-xl bg-muted p-6">
            <ShareWidget
              url={exampleUrl}
              title={exampleTitle}
              description={exampleDescription}
              variant="popup"
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <code className="font-mono text-xs text-muted-foreground">
              {`<ShareWidget url="..." title="..." variant="popup" />`}
            </code>
          </div>
        </section>

        {/* Minimal Variant */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Minimal
            </span>
            <h2 className="mt-3 text-xl font-semibold">Minimal Variant</h2>
            <p className="text-sm text-muted-foreground">
              Icons only, smallest footprint. Ideal for sidebars or floating share bars.
            </p>
          </div>

          <div className="rounded-xl bg-muted p-6">
            <ShareWidget
              url={exampleUrl}
              title={exampleTitle}
              description={exampleDescription}
              variant="minimal"
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <code className="font-mono text-xs text-muted-foreground">
              {`<ShareWidget url="..." title="..." variant="minimal" />`}
            </code>
          </div>
        </section>

        {/* Custom Platforms */}
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Custom
            </span>
            <h2 className="mt-3 text-xl font-semibold">Custom Platforms</h2>
            <p className="text-sm text-muted-foreground">
              Customize which platforms to show using the platforms prop.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-muted p-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                X + Copy only
              </p>
              <ShareWidget
                url={exampleUrl}
                title={exampleTitle}
                description={exampleDescription}
                platforms={['twitter', 'copy']}
                variant="inline"
              />
            </div>

            <div className="rounded-xl bg-muted p-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                LinkedIn + Facebook
              </p>
              <ShareWidget
                url={exampleUrl}
                title={exampleTitle}
                description={exampleDescription}
                platforms={['linkedin', 'facebook']}
                variant="minimal"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <code className="font-mono text-xs text-muted-foreground">
              {`<ShareWidget platforms={['twitter', 'copy']} ... />`}
            </code>
          </div>
        </section>
      </div>
    </div>
  );
}
