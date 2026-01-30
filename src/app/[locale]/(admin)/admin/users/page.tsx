import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { UserTable } from '@/components/admin/UserTable';
import { getUsersList } from '@/libs/queries/users';
import { createClient } from '@/libs/supabase/server';

type AdminUsersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
    status?: string;
  }>;
};

/**
 * Admin Users Management Page
 *
 * Server component that fetches users data and passes to client table component.
 * Note: Middleware already protects this route and verifies admin access.
 */
export default async function AdminUsersPage({
  params,
  searchParams,
}: AdminUsersPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Admin.Users' });

  // Parse query params
  const page = Math.max(1, Number.parseInt(resolvedSearchParams.page || '1', 10));
  const search = resolvedSearchParams.search || '';
  const sortBy = (resolvedSearchParams.sort || 'created_at') as 'created_at' | 'email';
  const sortOrder = (resolvedSearchParams.order || 'desc') as 'asc' | 'desc';
  const status = (resolvedSearchParams.status || 'all') as 'all' | 'active' | 'suspended' | 'pending';

  // Get current user ID for self-preservation checks
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id || '';

  // Fetch users data server-side
  const { users, total, error } = await getUsersList({
    page,
    limit: 20,
    search,
    sortBy,
    sortOrder,
    status,
  });

  // Handle fetch error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {t('error.loadFailed')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* User table with all controls */}
      <UserTable
        users={users}
        total={total}
        page={page}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        statusFilter={status}
        currentUserId={currentUserId}
      />
    </div>
  );
}
