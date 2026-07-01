'use client';

import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  CreditCard,
  Key,
  RefreshCw,
  Settings,
  Trash2,
  User as UserIcon,
  UserCog,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserSubscriptionDetail } from '@/libs/hooks/use-user-subscription-detail';
import { getUserInitials, getUserStatus } from '@/libs/queries/userUtils';

import { AssignTierDialog } from './AssignTierDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { SuspendUserDialog } from './SuspendUserDialog';

// Promotion tier slug — matches the server action's PROMO_TIER_NAME so the tier
// badge highlights promo grants without hardcoding product-specific copy.
const PROMO_TIER_NAME = 'promotion';

// Moved to module scope to satisfy e18e/prefer-static-regex.
const WHITESPACE_REGEX = /\s+/g;

type UserDetailDialogProps = {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onUserUpdated: () => void;
};

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
  currentUserId,
  onUserUpdated,
}: UserDetailDialogProps) {
  const t = useTranslations('Admin.UserDetail');
  const queryClient = useQueryClient();
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showAssignTierDialog, setShowAssignTierDialog] = useState(false);

  // Internal state to track user data after actions.
  const [localUser, setLocalUser] = useState<User | null>(null);

  // Use localUser if available (after an action), otherwise use prop.
  const displayUser = localUser ?? user;

  if (!displayUser) {
    return null;
  }

  const isOwnAccount = displayUser.id === currentUserId;
  const userStatus = getUserStatus(displayUser);
  const isSuspended = userStatus === 'suspended';

  // Reset local state when dialog closes.
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLocalUser(null);
    }
    onOpenChange(newOpen);
  };

  // Handle user updated from child dialogs.
  const handleUserUpdated = (updatedUser?: User) => {
    if (updatedUser) {
      setLocalUser(updatedUser);
    }
    onUserUpdated();
  };

  // Handle user deleted - close dialog and notify parent.
  const handleUserDeleted = () => {
    handleOpenChange(false);
    onUserUpdated();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]" data-testid="user-detail-dialog">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('title')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Profile Header */}
            <div className="flex items-center gap-4 border-b pb-6">
              <Avatar className="size-[72px]">
                <AvatarFallback className="bg-linear-to-br from-primary to-purple-500 text-2xl font-bold text-primary-foreground">
                  {getUserInitials(displayUser.email, displayUser.user_metadata?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-semibold">
                  {displayUser.user_metadata?.display_name || displayUser.email}
                </h3>
                <p className="truncate text-muted-foreground">{displayUser.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={userStatus}>
                    {t(`status.${userStatus}`)}
                  </Badge>
                  <Badge
                    variant={displayUser.email_confirmed_at ? 'active' : 'pending'}
                    className="gap-1"
                  >
                    {displayUser.email_confirmed_at
                      ? (
                          <>
                            <CheckCircle className="size-3" />
                            {t('verified')}
                          </>
                        )
                      : t('unverified')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserIcon className="size-4" />
                {t('sections.accountInfo')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  label={t('fields.username')}
                  value={
                    displayUser.user_metadata?.username
                      ? `@${displayUser.user_metadata.username}`
                      : t('notSet')
                  }
                />
                <InfoRow
                  label={t('fields.displayName')}
                  value={displayUser.user_metadata?.display_name || t('notSet')}
                />
                <InfoRow
                  label={t('fields.signupDate')}
                  value={format(new Date(displayUser.created_at), 'MMMM d, yyyy')}
                />
                <InfoRow
                  label={t('fields.lastLogin')}
                  value={
                    displayUser.last_sign_in_at
                      ? formatDistanceToNow(new Date(displayUser.last_sign_in_at), { addSuffix: true })
                      : t('never')
                  }
                />
                <InfoRow
                  label={t('fields.emailVerified')}
                  value={
                    displayUser.email_confirmed_at
                      ? format(new Date(displayUser.email_confirmed_at), 'MMM d, yyyy')
                      : t('notVerified')
                  }
                />
                <InfoRow
                  label={t('fields.userId')}
                  value={(
                    <span className="block max-w-[150px] truncate font-mono text-xs" title={displayUser.id}>
                      {displayUser.id.slice(0, 8)}
                      ...
                    </span>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Subscription Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="size-4" />
                  {t('sections.subscription')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignTierDialog(true)}
                  className="gap-1"
                  data-testid="open-assign-tier"
                >
                  <UserCog className="size-3.5" />
                  {t('actions.assignTier')}
                </Button>
              </div>

              <SubscriptionDetailGrid userId={displayUser.id} />
            </div>

            <Separator />

            {/* Actions Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Settings className="size-4" />
                {t('sections.actions')}
              </div>
              <div className="space-y-2">
                <ActionButton
                  icon={<Key className="size-[18px]" />}
                  iconBgClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  title={t('actions.resetPassword')}
                  description={t('actions.resetPasswordDesc')}
                  onClick={() => setShowResetDialog(true)}
                  disabled={isOwnAccount}
                />
                <ActionButton
                  icon={isSuspended ? <CheckCircle className="size-[18px]" /> : <Ban className="size-[18px]" />}
                  iconBgClassName="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  title={isSuspended ? t('actions.unsuspend') : t('actions.suspend')}
                  description={isSuspended ? t('actions.unsuspendDesc') : t('actions.suspendDesc')}
                  onClick={() => setShowSuspendDialog(true)}
                  disabled={isOwnAccount}
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3 rounded-lg border border-destructive bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="size-4" />
                {t('sections.dangerZone')}
              </div>
              <ActionButton
                icon={<Trash2 className="size-[18px]" />}
                iconBgClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                title={t('actions.delete')}
                description={t('actions.deleteDesc')}
                onClick={() => setShowDeleteDialog(true)}
                disabled={isOwnAccount}
                variant="danger"
              />
            </div>

            {/* Self-account warning */}
            {isOwnAccount && (
              <p className="text-center text-xs text-muted-foreground">
                {t('ownAccountWarning')}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => handleOpenChange(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <SuspendUserDialog
        user={displayUser}
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        isSuspended={isSuspended}
        onSuccess={handleUserUpdated}
      />

      <DeleteUserDialog
        user={displayUser}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleUserDeleted}
      />

      <ResetPasswordDialog
        user={displayUser}
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
      />

      <AssignTierDialog
        userId={displayUser.id}
        userEmail={displayUser.email ?? ''}
        open={showAssignTierDialog}
        onOpenChange={setShowAssignTierDialog}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['user-subscription-detail', displayUser.id] });
          handleUserUpdated();
        }}
      />
    </>
  );
}

// --- Subscription Detail Grid Sub-Component ---

function SubscriptionDetailGrid({ userId }: { userId: string }) {
  const t = useTranslations('Admin.UserDetail');
  const { data, isLoading, error, refetch } = useUserSubscriptionDetail(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span>{t('subscription.loadError')}</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="size-3" />
          {t('subscription.retry')}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">{t('subscription.noRecord')}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Current Tier */}
      <InfoRow
        label={t('fields.currentTier')}
        value={<TierBadge tierName={data.tierName} displayName={data.displayName} />}
      />

      {/* Status */}
      <InfoRow
        label={t('fields.subscriptionStatus')}
        value={<StatusBadge status={data.status} />}
      />

      {/* Trial Expires */}
      <InfoRow
        label={t('fields.trialExpires')}
        value={
          data.trialExpiresAt
            ? format(new Date(data.trialExpiresAt), 'MMM d, yyyy')
            : '–'
        }
      />

      {/* Plan Expires (promotion / paid window) */}
      <InfoRow
        label={t('fields.expiresAt')}
        value={
          data.expiresAt
            ? format(new Date(data.expiresAt), 'MMM d, yyyy')
            : '–'
        }
      />
    </div>
  );
}

// --- Badge Helper Components ---

function TierBadge({ tierName, displayName }: { tierName: string; displayName: string }) {
  if (tierName === PROMO_TIER_NAME) {
    return <Badge variant="pending">{displayName}</Badge>;
  }
  if (tierName === 'free') {
    return <Badge variant="secondary">{displayName}</Badge>;
  }
  // Any paid tier ('pro', etc.).
  return <Badge variant="default">{displayName}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="active">{status}</Badge>;
    case 'trial':
      return <Badge variant="pending">{status}</Badge>;
    case 'expired':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// Info row component for displaying key-value pairs.
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">
        {typeof value === 'string' && (!value || value === 'Not set')
          ? <span className="italic text-muted-foreground">{value || 'Not set'}</span>
          : value}
      </span>
    </div>
  );
}

// Action button component for user actions.
type ActionButtonProps = {
  icon: React.ReactNode;
  iconBgClassName: string;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
};

function ActionButton({
  icon,
  iconBgClassName,
  title,
  description,
  onClick,
  disabled,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors
        ${variant === 'danger' ? 'border-destructive hover:bg-destructive/10' : 'hover:bg-muted'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      data-testid={`action-${title.toLowerCase().replace(WHITESPACE_REGEX, '-')}`}
    >
      <div className={`flex size-9 items-center justify-center rounded-md ${iconBgClassName}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}
