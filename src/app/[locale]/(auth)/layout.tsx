import { MainAppShell } from '@/components/layout/MainAppShell';

export default function AuthLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return <MainAppShell>{props.children}</MainAppShell>;
}
