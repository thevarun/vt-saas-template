import { AuthDialogProvider } from '@/components/marketing/auth-dialog';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingThemeScope } from '@/components/marketing/marketing-theme-scope';
import { MarketingNavbar } from '@/components/marketing/navbar';
import { isDarkTheme } from '@/components/theme/theme-config';
import { SITE_CONFIG } from '@/config/site-config';
import { cn } from '@/utils/Helpers';

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
 *
 * Theme scoping: the shell carries `SITE_CONFIG.marketingTheme` as a CSS class,
 * which redefines the color tokens for this subtree ONLY. This decouples the
 * marketing look from the signed-in user's theme (there is no visitor toggle),
 * so a fork can give the landing site its own brand palette. The class is
 * rendered server-side from static config, so there is NO FOUC. `isDarkTheme`
 * adds `.dark` for dark marketing themes so Tailwind `dark:` variant utilities
 * resolve to the marketing theme's darkness.
 *
 * Two subtleties this handles:
 * - `dark:` utilities are ANCESTOR-scoped (`.dark *`), so a subtree `.light`
 *   can't cancel an OS-dark visitor's `<html class="dark">` (ThemeProvider uses
 *   `defaultTheme="system"`). The only `dark:` utilities in the marketing tree
 *   are on /terms + /privacy; those pages instead branch on
 *   `isDarkTheme(SITE_CONFIG.marketingTheme)` so they follow the marketing
 *   theme, not the visitor's OS. New marketing UI should do the same, not use
 *   `dark:`.
 * - Radix portals (the auth Dialog) mount to `document.body`, outside this
 *   wrapper. `MarketingThemeScope` mirrors the theme class onto `body` (client
 *   effect, like the admin panel) so portalled overlays inherit the marketing
 *   palette too.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = SITE_CONFIG.marketingTheme;
  const themeClass = cn(theme, isDarkTheme(theme) && 'dark');

  return (
    <AuthDialogProvider>
      <MarketingThemeScope themeClass={themeClass} />
      <div className={cn('flex min-h-screen flex-col bg-background text-foreground', themeClass)}>
        <MarketingNavbar />
        {/* pt-16 clears the fixed navbar (h-16); flex-1 makes content fill the
            viewport so the footer stays at the bottom on short/empty pages. */}
        <main className="flex-1 pt-16">{children}</main>
        <MarketingFooter />
      </div>
    </AuthDialogProvider>
  );
}
