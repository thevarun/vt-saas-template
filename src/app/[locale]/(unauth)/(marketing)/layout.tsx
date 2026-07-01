import { AuthDialogProvider } from '@/components/marketing/auth-dialog';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

/**
 * Shared chrome for every marketing page (`/`, `/about`, `/blog`, `/changelog`,
 * `/terms`, `/privacy`).
 *
 * This route group is the canonical marketing shell: it wraps all its children
 * in the brand-config-driven `MarketingNavbar` + `MarketingFooter` so the header
 * and footer are applied in exactly ONE place instead of per-page. Content pages
 * inside the group render page content only — no site chrome of their own.
 *
 * The `AuthDialogProvider` is scoped HERE (not the parent `(unauth)/layout.tsx`)
 * because only this subtree consumes the overlay dialog. It must wrap BOTH the
 * `MarketingNavbar` (whose CTAs call `openSignIn`/`openSignUp`) AND the page
 * `children` (which mount `AuthDialogAutoOpener`) so both stay descendants of
 * the provider — otherwise the dialog never opens.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthDialogProvider>
      <div className="flex min-h-screen flex-col">
        <MarketingNavbar />
        {/* pt-16 clears the fixed navbar (h-16); flex-1 makes content fill the
            viewport so the footer stays at the bottom on short/empty pages. */}
        <main className="flex-1 pt-16">{children}</main>
        <MarketingFooter />
      </div>
    </AuthDialogProvider>
  );
}
