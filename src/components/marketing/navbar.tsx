'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { useAuthDialog } from '@/components/marketing/auth-dialog';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { SITE_CONFIG } from '@/config/site-config';
import { useUser } from '@/hooks/useUser';

import {
  flatNavLinks,
  leadingNavLinks,
  resourcesLinks,
  trailingNavLinks,
} from './nav-config';

/**
 * Marketing shell Navbar (opt-in).
 *
 * A reusable, brand-config-driven header: sticky translucent bar with a shadcn
 * NavigationMenu Resources dropdown and a mobile flat menu. Brand name, logo,
 * and links come from `SITE_CONFIG` + `nav-config` so a fork rebrands in one
 * place. This is ADDITIVE — it does not replace `src/templates/Navbar.tsx`.
 *
 * Auth CTAs open the overlay `AuthDialog` (via `useAuthDialog`) so visitors can
 * sign in/up without leaving the page. The dedicated `/sign-in` + `/sign-up`
 * pages remain as fallbacks for direct URLs, password managers, and email links.
 *
 * TODO(i18n seam): labels are English-only literals via `nav-config`; swap to
 * next-intl there when localisation is needed.
 */

const primaryLinkClass
  = 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';

const triggerOverrideClass = `${primaryLinkClass} h-auto bg-transparent px-0 py-0 hover:bg-transparent focus:bg-transparent focus:text-foreground data-[state=open]:bg-transparent data-[state=open]:text-foreground data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent`;

const dropdownItemClass
  = 'block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none';

export const MarketingNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn, openSignUp } = useAuthDialog();
  const { brand } = SITE_CONFIG;

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold text-foreground"
        >
          <Image
            src={brand.logo.nav}
            alt=""
            width={32}
            height={32}
            className="size-8"
          />
          {brand.name}
        </Link>

        {/* Desktop: nav links + buttons grouped on the right */}
        <div className="hidden items-center gap-8 md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-6">
              {leadingNavLinks.map(l => (
                <NavigationMenuItem key={l.href}>
                  <NavigationMenuLink asChild>
                    <Link href={l.href} className={primaryLinkClass}>
                      {l.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}

              <NavigationMenuItem>
                <NavigationMenuTrigger className={triggerOverrideClass}>
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-72 gap-1 p-2">
                    {resourcesLinks.map(l => (
                      <li key={l.href}>
                        <NavigationMenuLink asChild>
                          <Link href={l.href} className={dropdownItemClass}>
                            <div className="text-foreground">{l.label}</div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {l.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {trailingNavLinks.map(l => (
                <NavigationMenuItem key={l.href}>
                  <NavigationMenuLink asChild>
                    <Link href={l.href} className={primaryLinkClass}>
                      {l.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-3">
            {user
              ? (
                  <Link href="/dashboard">
                    <Button size="sm" className="rounded-full px-5">
                      Dashboard
                    </Button>
                  </Link>
                )
              : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-5"
                      onClick={() => openSignIn()}
                    >
                      Log in
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full px-5"
                      onClick={() => openSignUp()}
                    >
                      Get started
                    </Button>
                  </>
                )}
          </div>
        </div>

        {/* Mobile CTA + toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Button
              size="sm"
              className="rounded-full px-4 text-xs"
              onClick={() => openSignUp()}
            >
              Get started
            </Button>
          )}
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — flat list (no dropdowns) */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pt-2 pb-4 md:hidden">
          {[...flatNavLinks, ...resourcesLinks].map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex items-center gap-3">
            {user
              ? (
                  <Link href="/dashboard">
                    <Button size="sm" className="rounded-full px-5">
                      Dashboard
                    </Button>
                  </Link>
                )
              : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-5"
                      onClick={() => {
                        setMobileOpen(false);
                        openSignIn();
                      }}
                    >
                      Log in
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full px-5"
                      onClick={() => {
                        setMobileOpen(false);
                        openSignUp();
                      }}
                    >
                      Get started
                    </Button>
                  </>
                )}
          </div>
        </div>
      )}
    </nav>
  );
};
