# Story 6.4: User Detail & Actions

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want to view user details and take actions,
so that I can manage individual accounts.

## Acceptance Criteria

### AC1: User Detail View Display
**Given** I click on a user in the list
**When** the detail view opens
**Then** I see full user information
**And** I see: email, username, display name, signup date
**And** I see: last login, email verified status
**And** I see: account status (active/suspended)

### AC2: Action Buttons Available
**Given** user detail view
**When** I look for actions
**Then** I see action buttons: Suspend, Delete, Reset Password
**And** actions are clearly labeled
**And** dangerous actions are visually distinct (red)

### AC3: Suspend/Unsuspend User
**Given** I click "Suspend User"
**When** user is currently active
**Then** I see confirmation dialog
**And** on confirm, user status changes to suspended
**And** suspended users cannot log in
**And** I see success confirmation

**Given** I click "Unsuspend User"
**When** user is currently suspended
**Then** I see confirmation dialog
**And** on confirm, user status changes to active
**And** user can log in again
**And** I see success confirmation

### AC4: Delete User with Strong Confirmation
**Given** I click "Delete User"
**When** I confirm the action
**Then** I see a strong warning about permanence
**And** I must type user email to confirm
**And** on confirm, user and their data are deleted
**And** I am redirected to user list

### AC5: Reset Password Action
**Given** I click "Reset Password"
**When** I confirm the action
**Then** password reset email is sent to user
**And** I see confirmation that email was sent
**And** user can use reset link to set new password

### AC6: Self-Preservation Protection
**Given** I am viewing my own admin account
**When** I look at actions
**Then** I cannot suspend or delete my own account
**And** self-destructive actions are disabled

## Tasks / Subtasks

- [ ] Task 1: Install required shadcn components (AC: #1, #2)
  - [ ] Subtask 1.1: Run `npx shadcn@latest add dialog alert-dialog button avatar`
  - [ ] Subtask 1.2: Verify components installed in `src/components/ui/`
  - [ ] Subtask 1.3: Check no TypeScript errors after installation

- [ ] Task 2: Create UserDetailDialog component (AC: #1, #2, #6)
  - [ ] Subtask 2.1: Create `src/components/admin/UserDetailDialog.tsx`
  - [ ] Subtask 2.2: Use shadcn Dialog with slide-over styling (max-w-[500px])
  - [ ] Subtask 2.3: Display user avatar with initials and gradient background
  - [ ] Subtask 2.4: Show email, username (or "Not set"), display name
  - [ ] Subtask 2.5: Show signup date (formatted: "January 15, 2024")
  - [ ] Subtask 2.6: Show last login (relative time or "Never")
  - [ ] Subtask 2.7: Show email verified status with badge (Verified/Unverified)
  - [ ] Subtask 2.8: Show account status with colored badge (Active/Suspended/Pending)
  - [ ] Subtask 2.9: Add section dividers using Separator component

- [ ] Task 3: Add action buttons to dialog (AC: #2, #6)
  - [ ] Subtask 3.1: Create action buttons section in dialog footer
  - [ ] Subtask 3.2: Add "Reset Password" button (outline variant)
  - [ ] Subtask 3.3: Add "Suspend User" / "Unsuspend User" button (conditional)
  - [ ] Subtask 3.4: Add "Delete User" button (destructive variant)
  - [ ] Subtask 3.5: Detect if viewing own account using user.id comparison
  - [ ] Subtask 3.6: Disable Suspend/Delete buttons for own account
  - [ ] Subtask 3.7: Add tooltip explaining why buttons are disabled
  - [ ] Subtask 3.8: Add visual styling for disabled state

- [ ] Task 4: Create API route for user suspension (AC: #3)
  - [ ] Subtask 4.1: Create `src/app/api/admin/users/[userId]/suspend/route.ts`
  - [ ] Subtask 4.2: Verify admin session with isAdmin() check
  - [ ] Subtask 4.3: Prevent self-suspension (check userId !== adminId)
  - [ ] Subtask 4.4: Use Supabase Admin API to update user.banned_until
  - [ ] Subtask 4.5: Set banned_until to far future date (e.g., 2099-12-31)
  - [ ] Subtask 4.6: Return success response with updated user data
  - [ ] Subtask 4.7: Handle Supabase errors with proper error responses
  - [ ] Subtask 4.8: Add request validation (userId format)

- [ ] Task 5: Create API route for user unsuspension (AC: #3)
  - [ ] Subtask 5.1: Create `src/app/api/admin/users/[userId]/unsuspend/route.ts`
  - [ ] Subtask 5.2: Verify admin session
  - [ ] Subtask 5.3: Use Supabase Admin API to set banned_until to null
  - [ ] Subtask 5.4: Return success response
  - [ ] Subtask 5.5: Handle errors appropriately

- [ ] Task 6: Implement suspend confirmation dialog (AC: #3)
  - [ ] Subtask 6.1: Create SuspendUserDialog component
  - [ ] Subtask 6.2: Use AlertDialog for confirmation
  - [ ] Subtask 6.3: Show warning about account suspension effects
  - [ ] Subtask 6.4: Add "Cancel" and "Suspend" buttons
  - [ ] Subtask 6.5: On confirm, call suspend API endpoint
  - [ ] Subtask 6.6: Show loading state during API call
  - [ ] Subtask 6.7: Show success toast on completion
  - [ ] Subtask 6.8: Refresh user data in dialog
  - [ ] Subtask 6.9: Update user table to reflect new status

- [ ] Task 7: Create API route for user deletion (AC: #4)
  - [ ] Subtask 7.1: Create `src/app/api/admin/users/[userId]/delete/route.ts`
  - [ ] Subtask 7.2: Verify admin session
  - [ ] Subtask 7.3: Prevent self-deletion (check userId !== adminId)
  - [ ] Subtask 7.4: Use Supabase Admin API to delete user
  - [ ] Subtask 7.5: CASCADE delete user's associated data (check foreign keys)
  - [ ] Subtask 7.6: Return success response
  - [ ] Subtask 7.7: Handle errors (e.g., user not found)
  - [ ] Subtask 7.8: Log deletion to audit log (Story 6.6 integration point)

- [ ] Task 8: Implement delete confirmation dialog (AC: #4)
  - [ ] Subtask 8.1: Create DeleteUserDialog component
  - [ ] Subtask 8.2: Use AlertDialog with type-to-confirm pattern
  - [ ] Subtask 8.3: Show strong warning about permanent data loss
  - [ ] Subtask 8.4: Add input field for typing user email
  - [ ] Subtask 8.5: Disable "Delete" button until email matches exactly
  - [ ] Subtask 8.6: Add case-insensitive email comparison
  - [ ] Subtask 8.7: On confirm, call delete API endpoint
  - [ ] Subtask 8.8: Show loading state during deletion
  - [ ] Subtask 8.9: On success, close dialog and navigate to user list
  - [ ] Subtask 8.10: Show success toast after redirect

- [ ] Task 9: Create API route for password reset (AC: #5)
  - [ ] Subtask 9.1: Create `src/app/api/admin/users/[userId]/reset-password/route.ts`
  - [ ] Subtask 9.2: Verify admin session
  - [ ] Subtask 9.3: Get user email from Supabase Admin API
  - [ ] Subtask 9.4: Use Supabase `resetPasswordForEmail()` to send reset email
  - [ ] Subtask 9.5: Return success response with confirmation
  - [ ] Subtask 9.6: Handle errors (e.g., email not confirmed)
  - [ ] Subtask 9.7: Log action to audit log (Story 6.6 integration point)

- [ ] Task 10: Implement password reset confirmation (AC: #5)
  - [ ] Subtask 10.1: Create ResetPasswordDialog component
  - [ ] Subtask 10.2: Use AlertDialog for confirmation
  - [ ] Subtask 10.3: Show message about sending reset email
  - [ ] Subtask 10.4: On confirm, call password reset API
  - [ ] Subtask 10.5: Show loading state during API call
  - [ ] Subtask 10.6: Show success toast with message
  - [ ] Subtask 10.7: Include email provider note (check spam folder)

- [ ] Task 11: Integrate UserDetailDialog with UserTable (AC: #1)
  - [ ] Subtask 11.1: Update UserTable to open UserDetailDialog on "View" button
  - [ ] Subtask 11.2: Pass selected user data to dialog
  - [ ] Subtask 11.3: Add dialog state management (open/close)
  - [ ] Subtask 11.4: Refresh table data when user is updated/deleted
  - [ ] Subtask 11.5: Handle loading states during refresh
  - [ ] Subtask 11.6: Add optimistic UI updates for better UX

- [ ] Task 12: Add i18n translations (AC: #1-#6)
  - [ ] Subtask 12.1: Add user detail translations to `src/locales/en.json`
  - [ ] Subtask 12.2: Add action button labels and tooltips
  - [ ] Subtask 12.3: Add confirmation dialog messages
  - [ ] Subtask 12.4: Add success/error toast messages
  - [ ] Subtask 12.5: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 12.6: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 12.7: Use `useTranslations('Admin.UserDetail')` in components

- [ ] Task 13: Write component tests (AC: #1-#6)
  - [ ] Subtask 13.1: Create `src/components/admin/UserDetailDialog.test.tsx`
  - [ ] Subtask 13.2: Test dialog renders with user data
  - [ ] Subtask 13.3: Test action buttons are visible (not own account)
  - [ ] Subtask 13.4: Test action buttons are disabled (own account)
  - [ ] Subtask 13.5: Test suspend confirmation flow
  - [ ] Subtask 13.6: Test delete confirmation with email typing
  - [ ] Subtask 13.7: Test password reset confirmation
  - [ ] Subtask 13.8: Mock API endpoints for isolation

- [ ] Task 14: Write API route tests (AC: #3-#5)
  - [ ] Subtask 14.1: Create tests for suspend API route
  - [ ] Subtask 14.2: Test admin authentication requirement
  - [ ] Subtask 14.3: Test self-suspension prevention
  - [ ] Subtask 14.4: Test successful suspension
  - [ ] Subtask 14.5: Create tests for delete API route
  - [ ] Subtask 14.6: Test self-deletion prevention
  - [ ] Subtask 14.7: Test successful deletion
  - [ ] Subtask 14.8: Create tests for password reset API route
  - [ ] Subtask 14.9: Test email sending confirmation

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The user detail UI is already designed and implemented in SuperDesign prototype with complete HTML/CSS.

| Screen/Component | Design Tool | Location | Files to Adapt |
|------------------|-------------|----------|----------------|
| User Detail Modal | SuperDesign | `.superdesign/design_iterations/admin_user_detail_1.html` | Full modal structure, user info display, action buttons |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`

**Adaptation Checklist:**
- [ ] Extract HTML modal structure from `.superdesign/design_iterations/admin_user_detail_1.html`
- [ ] Convert CSS classes and inline styles to Tailwind utility classes
- [ ] Replace custom modal with shadcn Dialog component
- [ ] Replace custom confirmation with shadcn AlertDialog component
- [ ] Add `"use client"` directive for components with state/hooks
- [ ] Wire up action buttons to API endpoints
- [ ] Add proper TypeScript types for user data and API responses
- [ ] Implement loading states with Button loading spinner
- [ ] Add success/error toast notifications
- [ ] Test responsive behavior on mobile
- [ ] Test dark mode appearance
- [ ] Handle edge cases (email not verified, never logged in)

**shadcn Components to Install:**
```bash
npx shadcn@latest add dialog alert-dialog button avatar separator toast
```

**Key Design Tokens from Prototype:**
- Dialog max-width: 500px
- Avatar size: 80px (large for detail view)
- Info label: text-sm, text-muted-foreground
- Info value: text-base, font-medium
- Section spacing: space-y-4
- Action button spacing: gap-2
- Destructive button color: bg-destructive

**Dialog Slide-Over Style:**
Add to Dialog component for side panel effect:
```typescript
<DialogContent className="sm:max-w-[500px] h-full sm:h-auto">
```

### Critical Architecture Requirements

**Supabase Admin API for User Management:**

The Supabase Admin API provides methods for managing user accounts. All user management actions MUST use the service role client.

**Admin Client Pattern (from Story 6.3):**
```typescript
import { getSupabaseAdmin } from '@/libs/supabase/admin'

const supabaseAdmin = getSupabaseAdmin()
```

**Key Supabase Admin Methods:**
1. **Suspend User:**
   ```typescript
   // Set banned_until to future date
   await supabaseAdmin.auth.admin.updateUserById(userId, {
     ban_duration: 'forever' // or specific duration
   })
   ```

2. **Unsuspend User:**
   ```typescript
   // Clear ban
   await supabaseAdmin.auth.admin.updateUserById(userId, {
     ban_duration: 'none'
   })
   ```

3. **Delete User:**
   ```typescript
   // Permanently delete user and auth data
   await supabaseAdmin.auth.admin.deleteUser(userId)
   ```

4. **Send Password Reset:**
   ```typescript
   // Trigger password reset email
   await supabaseAdmin.auth.resetPasswordForEmail(userEmail, {
     redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
   })
   ```

**API Route Pattern:**

All admin user action endpoints follow this pattern:

```typescript
// src/app/api/admin/users/[userId]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/libs/supabase/server'
import { getSupabaseAdmin } from '@/libs/supabase/admin'
import { isAdmin } from '@/libs/auth/isAdmin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get userId from params
    const { userId } = await params

    // 3. Prevent self-harm
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot perform this action on your own account' },
        { status: 403 }
      )
    }

    // 4. Perform action with admin client
    const supabaseAdmin = getSupabaseAdmin()
    // ... action-specific logic

    // 5. Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Type-to-Confirm Pattern for Delete:**

The delete confirmation requires typing the user email exactly to prevent accidental deletions:

```typescript
const [confirmEmail, setConfirmEmail] = useState('')
const isConfirmed = confirmEmail.toLowerCase() === user.email?.toLowerCase()

<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
      <AlertDialogDescription className="space-y-3">
        <p className="font-semibold text-destructive">
          This action cannot be undone!
        </p>
        <p>
          This will permanently delete the user account and all associated data.
          The user will be logged out immediately and cannot access the application again.
        </p>
        <p>
          Type <span className="font-mono font-semibold">{user.email}</span> to confirm:
        </p>
      </AlertDialogDescription>
    </AlertDialogHeader>

    <Input
      placeholder="Type user email to confirm"
      value={confirmEmail}
      onChange={(e) => setConfirmEmail(e.target.value)}
      autoComplete="off"
    />

    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={!isConfirmed || isDeleting}
        onClick={handleDelete}
        className="bg-destructive"
      >
        {isDeleting ? 'Deleting...' : 'Delete User'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Toast Notifications:**

Use shadcn's toast for user feedback:

```typescript
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

// Success toast
toast({
  title: 'User suspended',
  description: 'The user account has been suspended successfully.',
})

// Error toast
toast({
  title: 'Action failed',
  description: 'Failed to suspend user. Please try again.',
  variant: 'destructive',
})
```

**Self-Preservation Logic:**

Critical: Admins must not be able to suspend or delete their own accounts:

```typescript
const currentUser = // ... get from session
const isOwnAccount = targetUser.id === currentUser.id

// In component
<Button
  disabled={isOwnAccount}
  onClick={handleSuspend}
>
  Suspend User
</Button>

{isOwnAccount && (
  <Tooltip>
    <TooltipTrigger asChild>
      <InfoIcon className="h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      Cannot perform this action on your own account
    </TooltipContent>
  </Tooltip>
)}
```

**Status Determination Logic:**

User status is determined by Supabase auth fields:

```typescript
function getUserStatus(user: User): 'active' | 'suspended' | 'pending' {
  if (user.banned_until) {
    // Check if ban is still active
    const banDate = new Date(user.banned_until)
    if (banDate > new Date()) {
      return 'suspended'
    }
  }

  if (!user.email_confirmed_at) {
    return 'pending'
  }

  return 'active'
}
```

### Implementation Strategy

**Phase 1: Create UserDetailDialog Component**

1. **Component Structure:**
   ```typescript
   // src/components/admin/UserDetailDialog.tsx
   'use client'

   import { useState } from 'react'
   import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
   import { Avatar, AvatarFallback } from '@/components/ui/avatar'
   import { Badge } from '@/components/ui/badge'
   import { Button } from '@/components/ui/button'
   import { Separator } from '@/components/ui/separator'
   import { useTranslations } from 'next-intl'
   import { format, formatDistanceToNow } from 'date-fns'
   import type { User } from '@supabase/supabase-js'
   import { Shield, Ban, Trash2, Key } from 'lucide-react'

   interface UserDetailDialogProps {
     user: User | null
     open: boolean
     onOpenChange: (open: boolean) => void
     currentUserId: string
     onUserUpdated: () => void
   }

   export function UserDetailDialog({
     user,
     open,
     onOpenChange,
     currentUserId,
     onUserUpdated
   }: UserDetailDialogProps) {
     const t = useTranslations('Admin.UserDetail')
     const [showSuspendDialog, setShowSuspendDialog] = useState(false)
     const [showDeleteDialog, setShowDeleteDialog] = useState(false)
     const [showResetDialog, setShowResetDialog] = useState(false)

     if (!user) return null

     const isOwnAccount = user.id === currentUserId
     const userStatus = getUserStatus(user)
     const isSuspended = userStatus === 'suspended'

     return (
       <>
         <Dialog open={open} onOpenChange={onOpenChange}>
           <DialogContent className="sm:max-w-[500px]">
             <DialogHeader>
               <DialogTitle>{t('title')}</DialogTitle>
             </DialogHeader>

             <div className="space-y-6">
               {/* User Avatar and Email */}
               <div className="flex items-center gap-4">
                 <Avatar className="h-20 w-20">
                   <AvatarFallback className="text-2xl">
                     {getUserInitials(user.email || '', user.user_metadata?.username)}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1">
                   <h3 className="font-semibold text-lg">{user.email}</h3>
                   <p className="text-sm text-muted-foreground">
                     {user.user_metadata?.username || t('noUsername')}
                   </p>
                 </div>
               </div>

               <Separator />

               {/* User Information */}
               <div className="space-y-4">
                 <InfoRow
                   label={t('fields.displayName')}
                   value={user.user_metadata?.display_name || t('notSet')}
                 />
                 <InfoRow
                   label={t('fields.signupDate')}
                   value={format(new Date(user.created_at), 'MMMM d, yyyy')}
                 />
                 <InfoRow
                   label={t('fields.lastLogin')}
                   value={
                     user.last_sign_in_at
                       ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                       : t('never')
                   }
                 />
                 <InfoRow
                   label={t('fields.emailVerified')}
                   value={
                     <Badge variant={user.email_confirmed_at ? 'active' : 'pending'}>
                       {user.email_confirmed_at ? t('verified') : t('unverified')}
                     </Badge>
                   }
                 />
                 <InfoRow
                   label={t('fields.accountStatus')}
                   value={
                     <Badge variant={userStatus}>
                       {t(`status.${userStatus}`)}
                     </Badge>
                   }
                 />
               </div>

               <Separator />

               {/* Action Buttons */}
               <div className="space-y-2">
                 <div className="flex gap-2">
                   <Button
                     variant="outline"
                     className="flex-1"
                     onClick={() => setShowResetDialog(true)}
                     disabled={isOwnAccount}
                   >
                     <Key className="h-4 w-4 mr-2" />
                     {t('actions.resetPassword')}
                   </Button>

                   <Button
                     variant="outline"
                     className="flex-1"
                     onClick={() => setShowSuspendDialog(true)}
                     disabled={isOwnAccount}
                   >
                     <Ban className="h-4 w-4 mr-2" />
                     {isSuspended ? t('actions.unsuspend') : t('actions.suspend')}
                   </Button>
                 </div>

                 <Button
                   variant="destructive"
                   className="w-full"
                   onClick={() => setShowDeleteDialog(true)}
                   disabled={isOwnAccount}
                 >
                   <Trash2 className="h-4 w-4 mr-2" />
                   {t('actions.delete')}
                 </Button>

                 {isOwnAccount && (
                   <p className="text-xs text-muted-foreground text-center">
                     {t('ownAccountWarning')}
                   </p>
                 )}
               </div>
             </div>
           </DialogContent>
         </Dialog>

         {/* Confirmation Dialogs */}
         <SuspendUserDialog
           user={user}
           open={showSuspendDialog}
           onOpenChange={setShowSuspendDialog}
           isSuspended={isSuspended}
           onSuccess={() => {
             onUserUpdated()
             setShowSuspendDialog(false)
           }}
         />

         <DeleteUserDialog
           user={user}
           open={showDeleteDialog}
           onOpenChange={setShowDeleteDialog}
           onSuccess={() => {
             onOpenChange(false)
             onUserUpdated()
           }}
         />

         <ResetPasswordDialog
           user={user}
           open={showResetDialog}
           onOpenChange={setShowResetDialog}
         />
       </>
     )
   }

   function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
     return (
       <div className="flex justify-between items-center">
         <span className="text-sm text-muted-foreground">{label}</span>
         <span className="text-sm font-medium">{value}</span>
       </div>
     )
   }
   ```

2. **Utility Functions:**
   ```typescript
   function getUserInitials(email: string, username?: string): string {
     if (username) {
       return username.substring(0, 2).toUpperCase()
     }
     return email.substring(0, 2).toUpperCase()
   }

   function getUserStatus(user: User): 'active' | 'suspended' | 'pending' {
     if (user.banned_until) {
       const banDate = new Date(user.banned_until)
       if (banDate > new Date()) {
         return 'suspended'
       }
     }

     if (!user.email_confirmed_at) {
       return 'pending'
     }

     return 'active'
   }
   ```

**Phase 2: Create API Routes**

1. **Suspend User API:**
   ```typescript
   // src/app/api/admin/users/[userId]/suspend/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { cookies } from 'next/headers'
   import { createClient } from '@/libs/supabase/server'
   import { getSupabaseAdmin } from '@/libs/supabase/admin'
   import { isAdmin } from '@/libs/auth/isAdmin'

   export async function POST(
     request: NextRequest,
     { params }: { params: Promise<{ userId: string }> }
   ) {
     try {
       const cookieStore = await cookies()
       const supabase = createClient(cookieStore)
       const { data: { user } } = await supabase.auth.getUser()

       if (!user || !isAdmin(user)) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
       }

       const { userId } = await params

       if (userId === user.id) {
         return NextResponse.json(
           { error: 'Cannot suspend your own account' },
           { status: 403 }
         )
       }

       const supabaseAdmin = getSupabaseAdmin()
       const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
         userId,
         { ban_duration: '876000h' } // ~100 years
       )

       if (error) throw error

       return NextResponse.json({ success: true, user: data.user })
     } catch (error) {
       console.error('Suspend user error:', error)
       return NextResponse.json(
         { error: 'Failed to suspend user' },
         { status: 500 }
       )
     }
   }
   ```

2. **Unsuspend User API:**
   ```typescript
   // src/app/api/admin/users/[userId]/unsuspend/route.ts
   export async function POST(
     request: NextRequest,
     { params }: { params: Promise<{ userId: string }> }
   ) {
     try {
       const cookieStore = await cookies()
       const supabase = createClient(cookieStore)
       const { data: { user } } = await supabase.auth.getUser()

       if (!user || !isAdmin(user)) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
       }

       const { userId } = await params
       const supabaseAdmin = getSupabaseAdmin()

       const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
         userId,
         { ban_duration: 'none' }
       )

       if (error) throw error

       return NextResponse.json({ success: true, user: data.user })
     } catch (error) {
       console.error('Unsuspend user error:', error)
       return NextResponse.json(
         { error: 'Failed to unsuspend user' },
         { status: 500 }
       )
     }
   }
   ```

3. **Delete User API:**
   ```typescript
   // src/app/api/admin/users/[userId]/delete/route.ts
   export async function DELETE(
     request: NextRequest,
     { params }: { params: Promise<{ userId: string }> }
   ) {
     try {
       const cookieStore = await cookies()
       const supabase = createClient(cookieStore)
       const { data: { user } } = await supabase.auth.getUser()

       if (!user || !isAdmin(user)) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
       }

       const { userId } = await params

       if (userId === user.id) {
         return NextResponse.json(
           { error: 'Cannot delete your own account' },
           { status: 403 }
         )
       }

       const supabaseAdmin = getSupabaseAdmin()
       const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

       if (error) throw error

       return NextResponse.json({ success: true })
     } catch (error) {
       console.error('Delete user error:', error)
       return NextResponse.json(
         { error: 'Failed to delete user' },
         { status: 500 }
       )
     }
   }
   ```

4. **Reset Password API:**
   ```typescript
   // src/app/api/admin/users/[userId]/reset-password/route.ts
   export async function POST(
     request: NextRequest,
     { params }: { params: Promise<{ userId: string }> }
   ) {
     try {
       const cookieStore = await cookies()
       const supabase = createClient(cookieStore)
       const { data: { user } } = await supabase.auth.getUser()

       if (!user || !isAdmin(user)) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
       }

       const { userId } = await params
       const supabaseAdmin = getSupabaseAdmin()

       // Get user email
       const { data: targetUser, error: getUserError } =
         await supabaseAdmin.auth.admin.getUserById(userId)

       if (getUserError || !targetUser.user) {
         throw new Error('User not found')
       }

       // Send password reset email
       const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
         targetUser.user.email!,
         {
           redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
         }
       )

       if (error) throw error

       return NextResponse.json({ success: true })
     } catch (error) {
       console.error('Reset password error:', error)
       return NextResponse.json(
         { error: 'Failed to send reset email' },
         { status: 500 }
       )
     }
   }
   ```

**Phase 3: Create Confirmation Dialogs**

Create separate dialog components for each action:

1. **SuspendUserDialog.tsx**
2. **DeleteUserDialog.tsx** (with type-to-confirm)
3. **ResetPasswordDialog.tsx**

**Phase 4: Integrate with UserTable**

Update UserTable component to:
1. Add state for selected user and dialog open
2. Trigger UserDetailDialog on "View" button click
3. Refresh user list after actions complete
4. Handle optimistic UI updates

**Phase 5: Add Translations**

Add comprehensive translations for all dialog text, button labels, confirmation messages, and toast notifications.

**Phase 6: Testing**

Write comprehensive tests for:
1. Component rendering and interactions
2. API route authentication and authorization
3. Self-preservation logic
4. Type-to-confirm functionality
5. Error handling

### Previous Story Intelligence

**Learnings from Story 6.3:**

1. **Supabase Admin Client Setup:**
   - Successfully created `src/libs/supabase/admin.ts` for service role client
   - Pattern: `getSupabaseAdmin()` returns configured admin client
   - Used for listing users in user management table
   - MUST be server-side only (never expose to client)

2. **User Data Structure:**
   - Users from `auth.users` table via Admin API
   - Username in `user_metadata.username` (JSONB field)
   - Status determined by `banned_until` field (null = active)
   - Email verification: `email_confirmed_at` field
   - Last login: `last_sign_in_at` field

3. **Component Patterns:**
   - UserTable is client component with server-fetched data
   - Props pattern: pass data from server component to client
   - State management: useState for selections and dialogs
   - URL query params for pagination and search

4. **Badge Variants:**
   - Already added custom variants to Badge component
   - `active`: green, `suspended`: red, `pending`: yellow
   - Pattern established in `src/components/ui/badgeVariants.ts`

5. **API Integration:**
   - Server components fetch data, client components handle interactions
   - Next.js 15 patterns: await props.params for route params
   - Error handling with try/catch and NextResponse
   - Authentication check in every API route

6. **Toast Notifications:**
   - Not yet implemented in Story 6.3
   - Need to add toast provider to admin layout
   - Use shadcn's useToast hook for notifications

7. **Testing Approach:**
   - Mock next/navigation for router tests
   - Mock next-intl for translation tests
   - Mock Supabase clients for API isolation
   - 497 tests added for UserTable component

### Git Intelligence Summary

**Recent Commit Analysis (9b658fa - Story 6.3):**

**Files Created:**
- `src/app/[locale]/(admin)/admin/users/page.tsx` - User management page
- `src/components/admin/UserTable.tsx` - User list table component
- `src/components/admin/__tests__/UserTable.test.tsx` - Component tests
- `src/components/ui/avatar.tsx` - Avatar component (shadcn)
- `src/components/ui/badgeVariants.ts` - Custom badge variants
- `src/libs/queries/users.ts` - User query functions with admin client
- `src/locales/*.json` - Translations for user management

**Patterns Established:**
1. **Admin API Pattern:**
   ```typescript
   import { getSupabaseAdmin } from '@/libs/supabase/admin'
   const supabaseAdmin = getSupabaseAdmin()
   const { data } = await supabaseAdmin.auth.admin.listUsers()
   ```

2. **Server/Client Split:**
   - Server component: `page.tsx` fetches data
   - Client component: `UserTable.tsx` handles UI interactions
   - Props flow: server → client with serializable data

3. **Translation Structure:**
   - Nested keys: `Admin.Users.columns.user`
   - Client: `useTranslations('Admin.Users')`
   - Server: `await getTranslations('Admin.Users')`

4. **Component File Organization:**
   - Components: `src/components/admin/*.tsx`
   - Tests: `src/components/admin/__tests__/*.test.tsx`
   - Co-located tests for maintainability

**Code Style Consistency:**
- No semicolons (Antfu ESLint config)
- Single quotes for JSX attributes
- Absolute imports with `@/` prefix
- TypeScript interfaces for props
- Functional components with explicit return types

**Dependencies Added:**
- `date-fns`: Date formatting (already installed)
- shadcn components: avatar, badge extensions
- No new external dependencies needed for Story 6.4

**Test Coverage:**
- UserTable: 497 tests (comprehensive)
- Pattern: Mock external dependencies consistently
- Vitest + React Testing Library
- Tests co-located with components

### Security Considerations

**Admin Action Security:**

1. **Triple Authentication Layer:**
   - Middleware protects `/admin` routes
   - API routes verify admin session
   - Self-preservation checks prevent self-harm

2. **Service Role Key Protection:**
   - NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client
   - Only use in server-side code
   - API routes run on server (Next.js API routes are server-only)
   - Component actions call API routes, never use admin client directly

3. **Action Authorization:**
   - Every API route verifies `isAdmin(user)`
   - Check userId !== currentUserId for destructive actions
   - Return 401 Unauthorized for non-admins
   - Return 403 Forbidden for self-destructive actions

4. **Input Validation:**
   - Validate userId format (UUID)
   - Sanitize user input in confirmation dialogs
   - Use email exact match for delete confirmation
   - Prevent XSS in user-provided data (React escapes by default)

5. **Audit Logging (Story 6.6 Integration):**
   - Log all admin actions: suspend, unsuspend, delete, reset password
   - Store: admin_id, action, target_user_id, timestamp
   - Immutable log entries (no edit/delete in UI)

6. **Password Reset Security:**
   - Use Supabase's built-in reset flow (secure tokens)
   - Reset link expires after 1 hour (Supabase default)
   - Redirect to app's reset password page
   - Email verification required before reset

7. **Data Integrity:**
   - User deletion cascades to related data (check foreign keys)
   - Consider soft delete vs hard delete for compliance
   - Backup critical data before permanent deletion
   - GDPR compliance: user can request account deletion

### Performance Considerations

**Dialog Performance:**
- Lazy load confirmation dialogs (only render when needed)
- Use React.memo for dialog components if re-rendering issues
- Optimistic UI updates for better perceived performance

**API Call Optimization:**
- Debounce rapid action button clicks
- Show loading states immediately
- Use SWR or React Query for data fetching (future enhancement)
- Cache user data to avoid refetching on every action

**User List Refresh:**
- After user action, refresh only if user list is visible
- Optimistic update: update UI before API confirmation
- Revalidate data after action completes
- Consider WebSocket for real-time updates (future enhancement)

### Internationalization

**Translation Keys Structure:**

```json
{
  "Admin": {
    "UserDetail": {
      "title": "User Details",
      "noUsername": "Not set",
      "notSet": "Not set",
      "never": "Never",
      "verified": "Verified",
      "unverified": "Unverified",
      "ownAccountWarning": "You cannot perform destructive actions on your own account.",
      "fields": {
        "displayName": "Display Name",
        "signupDate": "Signup Date",
        "lastLogin": "Last Login",
        "emailVerified": "Email Verified",
        "accountStatus": "Account Status"
      },
      "status": {
        "active": "Active",
        "suspended": "Suspended",
        "pending": "Pending"
      },
      "actions": {
        "resetPassword": "Reset Password",
        "suspend": "Suspend User",
        "unsuspend": "Unsuspend User",
        "delete": "Delete User"
      },
      "suspend": {
        "title": "Suspend User Account?",
        "description": "This will prevent the user from logging in. The user will be logged out immediately and cannot access the application until unsuspended.",
        "confirm": "Suspend",
        "success": "User suspended successfully",
        "error": "Failed to suspend user"
      },
      "unsuspend": {
        "title": "Unsuspend User Account?",
        "description": "This will restore the user's access to the application. They will be able to log in again.",
        "confirm": "Unsuspend",
        "success": "User unsuspended successfully",
        "error": "Failed to unsuspend user"
      },
      "delete": {
        "title": "Delete User Account?",
        "warningStrong": "This action cannot be undone!",
        "description": "This will permanently delete the user account and all associated data. The user will be logged out immediately and cannot access the application again.",
        "confirmPrompt": "Type {email} to confirm:",
        "placeholder": "Type user email to confirm",
        "confirm": "Delete User",
        "success": "User deleted successfully",
        "error": "Failed to delete user"
      },
      "resetPassword": {
        "title": "Send Password Reset Email?",
        "description": "This will send a password reset email to the user. They will receive a link to set a new password.",
        "note": "The reset link will expire in 1 hour.",
        "confirm": "Send Reset Email",
        "success": "Password reset email sent",
        "successNote": "The user should receive the email shortly. Ask them to check spam if not received.",
        "error": "Failed to send reset email"
      }
    }
  }
}
```

### References

- [Source: Epic 6 Story 6.4 - _bmad-output/planning-artifacts/epics/epic-6-admin-panel-system-management.md] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md] - Component implementation strategy
- [Source: .superdesign/design_iterations/admin_user_detail_1.html] - Complete user detail prototype
- [Source: Story 6.3 - _bmad-output/implementation-artifacts/stories/6-3-user-management-list.md] - Previous story implementation
- [Source: src/libs/supabase/admin.ts] - Admin client utility (from Story 6.3)
- [Source: src/libs/queries/users.ts] - User query functions (from Story 6.3)
- [Source: src/components/admin/UserTable.tsx] - User table component to integrate with
- [Source: src/components/ui/badgeVariants.ts] - Custom badge variants
- [Source: CLAUDE.md#Authentication Flow] - Supabase auth patterns
- [Source: CLAUDE.md#Next.js 15 Async Params] - Server component route params
- [Source: CLAUDE.md#API Error Handling] - Error response patterns
- [Source: https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid] - Supabase Admin API documentation
- [Source: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser] - Delete user documentation
- [Source: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail] - Password reset documentation

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Desk Check

**Status:** approved
**Date:** 2026-01-29 00:50
**Full Report:** [View Report](../../screenshots/story-6.4/desk-check-report.md)

Visual quality validated. One minor hydration fix auto-applied (DeleteUserDialog `asChild` on AlertDialogDescription). Ready for code review.
