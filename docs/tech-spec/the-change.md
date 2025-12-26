# The Change

## Problem Statement

**Current Limitations:**
HealthCompanion users currently face significant limitations in their chat experience:

1. **Single Conversation Constraint:** Users can only maintain one active chat conversation. Starting a new health-related discussion overwrites or continues the previous conversation, making it impossible to organize different topics (e.g., nutrition vs. fitness vs. mental health) separately.

2. **No Conversation History:** There's no way to revisit previous conversations or reference past health discussions. Users lose context and continuity across sessions.

3. **Lack of Organization:** Users cannot categorize or manage multiple health topics, leading to confusion when switching between different health concerns.

4. **Basic Dashboard Layout:** The current dashboard layout doesn't provide an intuitive navigation structure or modern UX patterns expected in contemporary SaaS applications.

**User Impact:**
- Health discussions get mixed together, reducing clarity
- Users cannot track progress across different health goals
- No way to archive or organize past conversations
- Poor user experience compared to modern chat applications (ChatGPT, Claude, etc.)

**Technical Debt:**
- Current chat implementation doesn't leverage full capabilities of Assistant UI library (v0.11.47) which supports multi-threaded conversations
- No database persistence for conversation threads
- Missing thread management infrastructure

## Proposed Solution

**Multi-Threaded Chat System with Modern Dashboard:**

Transform HealthCompanion into a multi-threaded conversation platform with a professional sidebar-based layout, enabling users to:

1. **Create Unlimited Conversation Threads**
   - Each thread maintains independent conversation history with Dify AI
   - User-editable thread titles for easy identification
   - Archive old threads to keep workspace clean

2. **Thread List Sidebar**
   - Left sidebar displays all active threads (inspired by ChatGPT/Claude UX)
   - "New Thread" button to start fresh conversations
   - Visual indicators for active thread
   - Quick thread switching without page reload
   - Archive functionality for completed conversations

3. **Enhanced Chat Interface**
   - Right panel shows selected thread's conversation
   - Leverages Assistant UI Thread component for rich chat experience
   - Streaming responses continue working as-is
   - Maintains conversation context with Dify via conversation_id

4. **Persistent Thread Storage**
   - New `health_companion` schema in Supabase database
   - Thread metadata: title, timestamps, last message preview, archive status
   - Threads created after first message (when Dify returns conversation_id)
   - User-specific thread isolation for data security

5. **Modern Dashboard Layout**
   - Collapsible sidebar with navigation
   - Full-page experience (not constrained to narrow chat window)
   - Responsive design: mobile-friendly with overlay sidebar
   - Placeholder navigation for future features (Pricing, Feature 1, Feature 2)

**Technical Implementation:**
- Use Assistant UI ThreadList component for sidebar
- Use Assistant UI Thread component for chat interface
- Build thread management API endpoints (CRUD operations)
- Create Supabase schema and Drizzle ORM models
- Redesign dashboard layout component
- No migration of existing data (fresh start)

## Scope

**In Scope:**

✅ **Database & Schema**
- Create dedicated `health_companion` schema in Supabase
- Design and implement `threads` table with proper indexes
- Add Drizzle ORM schema definition for type-safe queries
- Generate database migrations

✅ **Thread Management APIs**
- `GET /api/threads` - List all threads for authenticated user
- `POST /api/threads` - Create new thread (after first message)
- `PATCH /api/threads/[id]` - Update thread (title, last message)
- `PATCH /api/threads/[id]/archive` - Archive/unarchive thread
- `DELETE /api/threads/[id]` - Delete thread permanently

✅ **Chat Interface Enhancement**
- Integrate Assistant UI ThreadList component in sidebar
- Migrate current chat to use Assistant UI Thread component
- Implement thread switching logic
- Auto-save thread after first message (when conversation_id available)
- Update thread metadata on new messages (last_message_preview, updated_at)

✅ **Dashboard Layout Redesign**
- Create new collapsible sidebar layout
- Implement responsive behavior (overlay on mobile)
- Add navigation items: Threads, Pricing (placeholder), Feature 1 (placeholder), Feature 2 (placeholder)
- Sidebar state persistence (open/closed)
- Keyboard shortcut for sidebar toggle (Ctrl/Cmd+B as per Assistant UI convention)

✅ **Thread Metadata Management**
- Thread title (user-editable, nullable)
- Created timestamp (auto-generated)
- Updated timestamp (auto-updated)
- Last message preview (first 100 characters)
- Archive status (boolean)

✅ **Responsive Design**
- Desktop: Sidebar visible by default, collapsible
- Tablet: Sidebar collapsible, icon-based navigation
- Mobile: Sidebar hidden by default, overlay when opened

✅ **User Experience Features**
- Thread title editing inline or via modal
- Empty state when no threads exist
- Loading states during thread fetch/switch
- Error handling for failed thread operations
- Confirmation dialog for thread deletion

**Out of Scope:**

❌ **Auto-generation of thread titles** from first message (future enhancement)
- Rationale: Adds complexity; Assistant UI supports manual titles with fallback

❌ **Thread limits or quotas** per user
- Rationale: Not needed initially; can add later if abuse detected

❌ **Migration of existing conversation data**
- Rationale: Fresh start approach; existing data minimal

❌ **Functional implementation of placeholder navigation items**
- Pricing, Feature 1, Feature 2 are placeholders only
- Clicking them does nothing (or shows "Coming Soon" toast)

❌ **Advanced thread features:**
- Thread search functionality
- Thread tags or categories
- Thread sharing or export
- Thread analytics (message count, duration, etc.)
- Bulk thread operations (select multiple, bulk archive)

❌ **Dify API modifications**
- Existing Dify integration remains unchanged
- conversation_id handling stays the same

❌ **Authentication changes**
- Supabase auth flow unchanged
- User management unchanged

❌ **Billing or subscription changes**
- No changes to Stripe integration

---
