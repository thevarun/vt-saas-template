import { UserIdentifier } from '@/components/analytics/UserIdentifier';
import { MainAppShell } from '@/components/layout/MainAppShell';

export default function AuthLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      <UserIdentifier />
      <MainAppShell>{props.children}</MainAppShell>
    </>
  );
}
