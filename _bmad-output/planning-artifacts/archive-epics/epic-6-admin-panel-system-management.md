# Epic 6: Admin Panel & System Management

**Goal:** Admins can manage users and monitor system health

**UX Design Artifacts:**
- [Design Brief](../ux-design/epic-6-admin-design-brief.md)
- [Component Strategy](../ux-design/epic-6-admin-component-strategy.md)
- [Layouts](../ux-design/epic-6-admin-layouts.md)

## Story 6.1: Admin Role & Access Control

As a **product owner**,
I want **admin access controlled by a simple flag**,
So that **only authorized users can access admin features**.

**Acceptance Criteria:**

**Given** user roles
**When** I check if a user is admin
**Then** admin status is determined by user_metadata.isAdmin flag
**Or** admin status is determined by ADMIN_EMAILS env var list

**Given** the admin check implementation
**When** I review the code
**Then** there is a utility function `isAdmin(user)` or similar
**And** function checks both DB flag and env var fallback
**And** function is used consistently across admin features

**Given** a non-admin user
**When** they try to access `/admin/*` routes
**Then** middleware blocks the request
**And** user is redirected to dashboard
**And** they see "Access denied" message

**Given** an admin user
**When** they access `/admin/*` routes
**Then** access is granted
**And** admin content is displayed
**And** admin-specific navigation is visible

**Given** the environment variable approach
**When** ADMIN_EMAILS is set (e.g., "admin@example.com,owner@example.com")
**Then** users with those emails are treated as admins
**And** this works without database changes
**And** useful for initial setup before DB-based roles

**Given** the middleware protection
**When** admin routes are accessed
**Then** check happens at edge (middleware.ts)
**And** unauthorized requests never reach route handlers
**And** performance impact is minimal

---

## Story 6.2: Admin Layout & Navigation

As an **admin user**,
I want **a dedicated admin interface**,
So that **I can easily navigate admin features**.

**Acceptance Criteria:**

**Given** I am an admin accessing admin section
**When** I view any admin page
**Then** I see an admin-specific layout
**And** layout is distinct from regular user layout
**And** admin navigation is visible

**Given** the admin navigation
**When** I view the sidebar/menu
**Then** I see links to: Dashboard, Users, Feedback, Settings
**And** current page is highlighted
**And** navigation is collapsible on mobile

**Given** the admin header
**When** I view admin pages
**Then** I see "Admin" indicator clearly
**And** I can navigate back to main app
**And** my user avatar/menu is accessible

**Given** admin pages
**When** I navigate between them
**Then** transitions are smooth
**And** active state updates correctly
**And** breadcrumbs show current location (optional)

**Given** the admin layout on mobile
**When** I view on small screens
**Then** navigation collapses to hamburger menu
**And** content is properly responsive
**And** all features remain accessible

**Given** the admin route structure
**When** I review the code
**Then** admin routes are under `src/app/[locale]/(admin)/`
**And** layout is defined at route group level
**And** layout is self-contained (modular)

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_layout_1.html`
- **Components:** shadcn `Sheet`, custom `AdminLayout`, `AdminSidebar`, `AdminHeader`

---

## Story 6.3: User Management List

As an **admin**,
I want **to see all users in the system**,
So that **I can find and manage user accounts**.

**Acceptance Criteria:**

**Given** I am on the admin users page
**When** the page loads
**Then** I see a list of all users
**And** list shows: email, username, signup date, status
**And** list is paginated (20 per page default)

**Given** the user list
**When** I look for search
**Then** I see a search input
**And** I can search by email or username
**And** search filters results in real-time or on submit

**Given** the user list
**When** I want to sort
**Then** I can sort by signup date (newest/oldest)
**And** I can sort by email alphabetically
**And** current sort is indicated visually

**Given** a user row in the list
**When** I view the row
**Then** I see their email
**And** I see their username (or "Not set")
**And** I see signup date (relative or formatted)
**And** I see status indicator (active, suspended)
**And** I see quick action buttons

**Given** pagination
**When** there are more than 20 users
**Then** I see pagination controls
**And** I can navigate between pages
**And** current page is indicated
**And** total user count is shown

**Given** the user list is empty
**When** no users exist (unlikely)
**Then** I see an appropriate empty state

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_users_1.html`
- **Components:** shadcn `Table`, `Checkbox`, `Input`, `DropdownMenu`, `Badge`

---

## Story 6.4: User Detail & Actions

As an **admin**,
I want **to view user details and take actions**,
So that **I can manage individual accounts**.

**Acceptance Criteria:**

**Given** I click on a user in the list
**When** the detail view opens
**Then** I see full user information
**And** I see: email, username, display name, signup date
**And** I see: last login, email verified status
**And** I see: account status (active/suspended)

**Given** user detail view
**When** I look for actions
**Then** I see action buttons: Suspend, Delete, Reset Password
**And** actions are clearly labeled
**And** dangerous actions are visually distinct (red)

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

**Given** I click "Delete User"
**When** I confirm the action
**Then** I see a strong warning about permanence
**And** I must type user email to confirm
**And** on confirm, user and their data are deleted
**And** I am redirected to user list

**Given** I click "Reset Password"
**When** I confirm the action
**Then** password reset email is sent to user
**And** I see confirmation that email was sent
**And** user can use reset link to set new password

**Given** I am viewing my own admin account
**When** I look at actions
**Then** I cannot suspend or delete my own account
**And** self-destructive actions are disabled

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_user_detail_1.html`
- **Components:** shadcn `Dialog`, `AlertDialog`, `Button`, `Avatar`

---

## Story 6.5: System Metrics Dashboard

As an **admin**,
I want **to see key system metrics at a glance**,
So that **I can monitor the health of the application**.

**Acceptance Criteria:**

**Given** I am on the admin dashboard
**When** the page loads
**Then** I see key metrics displayed as cards
**And** metrics include: Total Users, New Signups (7d), Active Users (7d)
**And** metrics include: Pending Feedback, Error Count (if available)

**Given** each metric card
**When** I view it
**Then** I see the metric name
**And** I see the current value (large, prominent)
**And** I see trend indicator if applicable (+5% this week)
**And** design is clean and scannable

**Given** the Total Users metric
**When** I view it
**Then** I see count of all registered users
**And** count is accurate and real-time

**Given** the New Signups metric
**When** I view it
**Then** I see count of users registered in last 7 days
**And** I can optionally see daily breakdown

**Given** the Active Users metric
**When** I view it
**Then** I see count of users who logged in last 7 days
**And** metric is based on session/login data

**Given** the Pending Feedback metric
**When** I view it
**Then** I see count of unreviewed feedback
**And** clicking navigates to feedback page

**Given** the admin dashboard
**When** data is loading
**Then** I see skeleton loaders for each metric
**And** dashboard remains usable during loading

**Given** the dashboard layout
**When** I view on different screen sizes
**Then** metric cards reflow appropriately
**And** 4 columns on desktop, 2 on tablet, 1 on mobile

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_layout_1.html`
- **Components:** shadcn `Card`, custom `MetricCard`

---

## Story 6.6: Admin Audit Logging

As a **product owner**,
I want **admin actions to be logged**,
So that **I have accountability and can troubleshoot issues**.

**Acceptance Criteria:**

**Given** an admin performs an action
**When** the action is: suspend user, delete user, reset password
**Then** an audit log entry is created
**And** entry includes: admin_id, action, target_user_id, timestamp
**And** entry includes: metadata (reason if provided)

**Given** the audit log schema
**When** I review the database
**Then** admin_audit_log table exists
**And** table has: id, admin_id, action, target_type, target_id, metadata, created_at
**And** appropriate indexes exist

**Given** the admin panel
**When** I look for audit log
**Then** I can access audit log from admin settings
**And** I see a list of recent admin actions
**And** list shows: action, admin, target, timestamp

**Given** the audit log list
**When** I view entries
**Then** I can filter by action type
**And** I can filter by date range
**And** I can filter by admin user

**Given** audit log entries
**When** I review them
**Then** entries are tamper-resistant (no edit/delete in UI)
**And** entries are retained for compliance period
**And** sensitive data is appropriately logged (no passwords)

**Given** the audit logging implementation
**When** I review the code
**Then** logging is done server-side only
**And** logging function is reusable: `logAdminAction(action, target, metadata)`
**And** logging failures don't break admin actions (graceful)

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_audit_1.html`
- **Components:** shadcn `Table`, `Badge`, `Select`

---

## Story 6.7: Email Testing UI

As an **admin**,
I want **a visual interface to test email templates**,
So that **I can verify email delivery and rendering in production**.

**Acceptance Criteria:**

**Given** I am on the admin email testing page
**When** the page loads
**Then** I see a dropdown of available email templates
**And** I see an input for recipient email address
**And** I see template-specific data fields (if applicable)

**Given** I select a template and enter an email
**When** I click "Send Test Email"
**Then** the email is sent via Resend
**And** I see success confirmation with send status
**And** actual email arrives at the specified address

**Given** the email send fails
**When** Resend returns an error
**Then** I see the error message clearly displayed
**And** I can retry the send

**Given** the email testing page
**When** I review security
**Then** page is only accessible to admins
**And** protected by the same middleware as other admin routes
**And** rate limited to prevent abuse (optional)

**Given** the email testing implementation
**When** I review the code
**Then** API route is at `/api/admin/email/test`
**And** route validates admin session before processing
**And** route accepts `{ template: string, email: string, data?: object }`

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_email_1.html`
- **Components:** shadcn `Select`, `Input`, `Textarea`, `Button`, custom `EmailPreview`

---

## Story 6.8: Feedback Admin List View

As an **admin reviewing feedback**,
I want **to see all feedback submissions in one place**,
So that **I can understand user needs and issues**.

**Acceptance Criteria:**

**Given** I am an admin user
**When** I navigate to the admin feedback page
**Then** I see a list of all feedback submissions
**And** list is sorted by newest first (default)
**And** list shows: type, message preview, user/email, date, status

**Given** the feedback list
**When** I view it
**Then** I can filter by type (Bug, Feature, Praise, All)
**And** I can filter by status (Pending, Reviewed, Archived, All)
**And** filters update the list without page reload

**Given** a feedback item in the list
**When** I view the preview
**Then** I see the first ~100 characters of the message
**And** I see the feedback type with color coding
**And** I see relative timestamp ("2 hours ago")
**And** I see user email or "Anonymous"

**Given** I click on a feedback item
**When** the detail view opens
**Then** I see the full message
**And** I see all metadata (type, user, date, status)
**And** I can take actions (mark reviewed, delete)

**Given** the admin feedback page
**When** I access it as non-admin
**Then** I am redirected to dashboard
**And** I see "Access denied" or similar message

**Given** the feedback list is empty
**When** no feedback exists
**Then** I see an empty state
**And** message indicates no feedback yet

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_feedback_1.html`
- **Components:** shadcn `Tabs`, `Card`, `Badge`, custom `FeedbackCard`

---

## Story 6.9: Feedback Admin Actions

As an **admin managing feedback**,
I want **to take actions on feedback items**,
So that **I can track what's been reviewed and export data**.

**Acceptance Criteria:**

**Given** a pending feedback item
**When** I click "Mark as Reviewed"
**Then** status changes to "reviewed"
**And** reviewed_at timestamp is set
**And** UI updates to reflect new status
**And** I see confirmation toast

**Given** a feedback item
**When** I click "Delete"
**Then** I see a confirmation dialog
**And** dialog warns about permanent deletion
**And** on confirm, item is deleted from database
**And** list updates to remove the item

**Given** I click "Archive"
**When** I archive a feedback item
**Then** status changes to "archived"
**And** item remains in database but hidden by default
**And** I can filter to see archived items

**Given** the feedback admin page
**When** I click "Export CSV"
**Then** a CSV file is downloaded
**And** file contains: id, type, message, email, status, created_at, reviewed_at
**And** filename includes date (e.g., feedback-2024-01-15.csv)

**Given** filters are active
**When** I export CSV
**Then** only filtered results are exported
**And** export reflects current filter state

**Given** bulk actions
**When** I select multiple feedback items
**Then** I can mark all as reviewed
**And** I can delete all selected
**And** confirmation is required for bulk actions

**UX Design:**
- **Prototype:** `.superdesign/design_iterations/admin_feedback_1.html`
- **Components:** shadcn `Button`, `AlertDialog`, `Checkbox`

---
