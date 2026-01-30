import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';

/**
 * Admin Layout
 * Server component wrapper for the admin section
 *
 * Note: Middleware from Story 6.1 handles admin authentication.
 * This layout can assume the user IS an admin.
 */
export default function AdminLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <AdminLayoutClient>{props.children}</AdminLayoutClient>;
}
