'use client';

import type { User } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Mail,
  Pencil,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useState, useTransition } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getUserInitials, getUserStatus } from '@/libs/queries/users';

import { UserDetailDialog } from './UserDetailDialog';

type UserTableProps = {
  users: User[];
  total: number;
  page: number;
  search: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statusFilter?: string;
  currentUserId: string;
};

const ITEMS_PER_PAGE = 20;

export function UserTable({
  users,
  total,
  page,
  search,
  sortBy = 'created_at',
  sortOrder = 'desc',
  statusFilter = 'all',
  currentUserId,
}: UserTableProps) {
  const t = useTranslations('Admin.Users');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState(search);

  // User detail dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Handle opening user detail dialog
  const handleViewUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  }, []);

  // Handle user updated - refresh the table data
  const handleUserUpdated = useCallback(() => {
    // Trigger a page refresh to get latest data
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Debounced search update
  const updateURL = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`?${newParams.toString()}`);
    });
  }, [router, searchParams]);

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    // Reset to page 1 on search
    updateURL({ search: value, page: '1' });
  }, [updateURL]);

  // Handle sort
  const handleSort = useCallback((column: 'email' | 'created_at') => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    updateURL({ sort: column, order: newOrder });
  }, [sortBy, sortOrder, updateURL]);

  // Handle status filter
  const handleStatusFilter = useCallback((status: string) => {
    updateURL({ status: status === 'all' ? null : status, page: '1' });
  }, [updateURL]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    updateURL({ page: newPage.toString() });
  }, [updateURL]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  }, [users, selectedUsers.size]);

  const toggleSelectUser = useCallback((userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }, [selectedUsers]);

  // Get status badge variant
  const getStatusBadge = (user: User) => {
    const status = getUserStatus(user);
    const variant = status === 'active' ? 'active' : status === 'suspended' ? 'suspended' : 'pending';
    return (
      <Badge variant={variant}>
        {t(`status.${status}`)}
      </Badge>
    );
  };

  // Calculate pagination
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, total);

  // Get sort icon for column
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 size-4" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="ml-1 size-4 text-primary" />
      : <ArrowDown className="ml-1 size-4 text-primary" />;
  };

  // Get status filter label
  const getStatusFilterLabel = () => {
    if (statusFilter === 'all') {
      return t('filter.statusAll');
    }
    return t(`status.${statusFilter}`);
  };

  return (
    <div className="space-y-4" data-testid="user-table">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-[280px] flex-1 items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
              data-testid="user-search-input"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="status-filter-button">
                <Filter className="mr-2 size-4" />
                {getStatusFilterLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-accent' : ''}
              >
                {t('filter.statusAll')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-accent' : ''}
              >
                {t('status.active')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusFilter('suspended')}
                className={statusFilter === 'suspended' ? 'bg-accent' : ''}
              >
                {t('status.suspended')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-accent' : ''}
              >
                {t('status.pending')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 size-4" />
            {t('actions.export')}
          </Button>
          <Button size="sm" disabled>
            <UserPlus className="mr-2 size-4" />
            {t('actions.addUser')}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-muted px-4 py-3" data-testid="bulk-actions-bar">
          <span className="font-medium">
            {selectedUsers.size}
            {' '}
            {t('bulkActions.selected')}
          </span>
          <div className="h-5 w-px bg-border" />
          <Button variant="outline" size="sm" disabled>
            <Mail className="mr-2 size-4" />
            {t('bulkActions.email')}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Ban className="mr-2 size-4" />
            {t('bulkActions.suspend')}
          </Button>
          <Button variant="destructive" size="sm" disabled>
            <Trash2 className="mr-2 size-4" />
            {t('bulkActions.delete')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-lg border ${isPending ? 'opacity-50' : ''}`}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={users.length > 0 && selectedUsers.size === users.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label={t('bulkActions.selectAll')}
                  data-testid="select-all-checkbox"
                />
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex cursor-pointer items-center font-medium hover:text-foreground"
                  onClick={() => handleSort('email')}
                  data-testid="sort-email-button"
                >
                  {t('columns.user')}
                  {getSortIcon('email')}
                </button>
              </TableHead>
              <TableHead>{t('columns.status')}</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex cursor-pointer items-center font-medium hover:text-foreground"
                  onClick={() => handleSort('created_at')}
                  data-testid="sort-signup-button"
                >
                  {t('columns.signedUp')}
                  {getSortIcon('created_at')}
                </button>
              </TableHead>
              <TableHead>{t('columns.lastLogin')}</TableHead>
              <TableHead className="w-32">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t('empty.noUsers')}
                    </TableCell>
                  </TableRow>
                )
              : (
                  users.map(user => (
                    <TableRow key={user.id} className="group" data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                          aria-label={`Select ${user.email}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500 text-primary-foreground">
                              {getUserInitials(user.email, user.user_metadata?.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.user_metadata?.username
                                ? `@${user.user_metadata.username}`
                                : t('noUsername')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.last_sign_in_at
                          ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                          : t('never')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => handleViewUser(user)}
                                  data-testid={`view-user-${user.id}`}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('actions.view')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8" disabled>
                                  <Pencil className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('actions.edit')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" disabled>
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('actions.delete')}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t bg-muted/50 px-4 py-3 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            {t('pagination.showing', {
              start: total > 0 ? startItem : 0,
              end: endItem,
              total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1 || isPending}
              onClick={() => handlePageChange(page - 1)}
              data-testid="pagination-prev"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Page numbers */}
            {generatePageNumbers(page, totalPages).map((pageNum, index) => (
              pageNum === '...'
                ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                  )
                : (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="icon"
                      className="size-8"
                      disabled={isPending}
                      onClick={() => handlePageChange(Number(pageNum))}
                      data-testid={`pagination-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  )
            ))}

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages || isPending}
              onClick={() => handlePageChange(page + 1)}
              data-testid="pagination-next"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={selectedUser}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        currentUserId={currentUserId}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

/**
 * Generates an array of page numbers to display in pagination.
 * Shows first page, last page, current page, and pages around current.
 * Uses '...' for ellipsis when there are gaps.
 */
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Always show first page
  pages.push(1);

  // Show ellipsis or pages after first
  if (current > 3) {
    pages.push('...');
  }

  // Pages around current
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Show ellipsis or pages before last
  if (current < total - 2) {
    pages.push('...');
  }

  // Always show last page
  if (total > 1 && !pages.includes(total)) {
    pages.push(total);
  }

  return pages;
}
