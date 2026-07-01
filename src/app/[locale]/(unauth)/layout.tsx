import { AuthDialogProvider } from '@/components/marketing/auth-dialog';

export default function UnauthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthDialogProvider>{children}</AuthDialogProvider>;
}
