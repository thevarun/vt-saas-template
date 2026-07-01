import { AuthDialogProvider } from '@/components/marketing/auth-dialog';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

/**
 * Demo route group for the opt-in marketing shell.
 *
 * Wraps children in the brand-config-driven `MarketingNavbar` + `MarketingFooter`
 * so a fork can SEE the shell rendered. This is ADDITIVE and does not affect the
 * existing `(unauth)` pages, which keep using `src/templates/Navbar`/`Footer`.
 *
 * The `AuthDialogProvider` is scoped HERE (not the parent `(unauth)/layout.tsx`)
 * because only this subtree consumes the overlay dialog. It must wrap BOTH the
 * `MarketingNavbar` (whose CTAs call `openSignIn`/`openSignUp`) AND the page
 * `children` (which mount `AuthDialogAutoOpener`) so both stay descendants of
 * the provider — otherwise the dialog never opens.
 *
 * A fork opts in by moving (or pointing) its marketing pages at this layout.
 */
export default function MarketingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthDialogProvider>
      <MarketingNavbar />
      {/* pt-16 offsets the fixed navbar height (h-16). */}
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </AuthDialogProvider>
  );
}
