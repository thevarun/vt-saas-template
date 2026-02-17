import type { Metadata } from 'next';

import { MainAppShell } from '@/components/layout/MainAppShell';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  // Override parent layout's hreflang alternates — protected pages should not have language alternates
  alternates: {
    languages: {},
  },
};

export default function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <MainAppShell>{props.children}</MainAppShell>;
}
