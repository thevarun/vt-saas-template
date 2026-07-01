import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

/**
 * Demo route group for the opt-in marketing shell.
 *
 * Wraps children in the brand-config-driven `MarketingNavbar` + `MarketingFooter`
 * so a fork can SEE the shell rendered. This is ADDITIVE and does not affect the
 * existing `(unauth)` pages, which keep using `src/templates/Navbar`/`Footer`.
 *
 * A fork opts in by moving (or pointing) its marketing pages at this layout.
 */
export default function MarketingV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNavbar />
      {/* pt-16 offsets the fixed navbar height (h-16). */}
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </>
  );
}
