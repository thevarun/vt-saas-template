# VT SaaS Template - Component Inventory

**Generated:** 2026-01-02
**UI Library:** React 18.3.1
**Framework:** Next.js 14 (App Router)
**Component System:** shadcn/ui + Custom Components

---

## Overview

VT SaaS Template uses a component-based architecture with **38+ React components** organized into functional categories. The UI is built on **shadcn/ui** (Radix UI primitives) with custom chat and layout components.

**Total Components:** 38+
**Component Libraries:**
- shadcn/ui (15 components)
- Custom Chat Components (10 components)
- Layout Components (2 components)
- Shared Components (4 components)
- Feature Components (7+ components)

---

## Component Categories

### 1. UI Components (`src/components/ui/`)

**Source:** shadcn/ui (Radix UI + Tailwind CSS)

**Purpose:** Base UI primitives for consistent, accessible design

| Component | File | Purpose | Radix Primitive |
|-----------|------|---------|-----------------|
| Button | `button.tsx` | Interactive buttons with variants | - |
| Input | `input.tsx` | Form text inputs | - |
| Label | `label.tsx` | Form labels | `@radix-ui/react-label` |
| Form | `form.tsx` | Form wrapper with validation | `react-hook-form` |
| Dialog | `dialog.tsx` | Modal dialogs | `@radix-ui/react-dialog` |
| Dropdown Menu | `dropdown-menu.tsx` | Context menus, selects | `@radix-ui/react-dropdown-menu` |
| Toast | `toast.tsx` | Notification toasts | `@radix-ui/react-toast` |
| Toaster | `toaster.tsx` | Toast container | `@radix-ui/react-toast` |
| Tooltip | `tooltip.tsx` | Hover tooltips | `@radix-ui/react-tooltip` |
| Separator | `separator.tsx` | Divider lines | `@radix-ui/react-separator` |
| Sheet | `sheet.tsx` | Slide-out panels | `@radix-ui/react-dialog` |
| Skeleton | `skeleton.tsx` | Loading placeholders | - |
| Badge | `badge.tsx` | Status badges | - |
| Table | `table.tsx` | Data tables | - |
| Data Table | `data-table.tsx` | Enhanced table with sorting | `@tanstack/react-table` |
| Accordion | `accordion.tsx` | Collapsible sections | `@radix-ui/react-accordion` |

**Design System:**
- Tailwind CSS for styling
- Class Variance Authority (CVA) for variants
- Consistent design tokens
- Dark mode support

---

### 2. Chat Components (`src/components/chat/`)

**Purpose:** AI chat interface with streaming support

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| ChatInterface | `ChatInterface.tsx` | Client | Main chat UI with Assistant UI integration |
| ThreadListSidebar | `ThreadListSidebar.tsx` | Client | Thread management sidebar |
| ThreadItem | `ThreadItem.tsx` | Client | Single thread in list |
| ThreadView | `ThreadView.tsx` | Client | Active thread display area |
| ThreadTitleEditor | `ThreadTitleEditor.tsx` | Client | Inline title editing |
| Thread | `Thread.tsx` | Client | Thread wrapper component |
| AppShell | `AppShell.tsx` | Server | Chat layout with sidebar |
| EmptyThreadState | `EmptyThreadState.tsx` | Server | Empty state UI |
| ErrorThreadState | `ErrorThreadState.tsx` | Server | Error state UI |
| ThreadListSkeleton | `ThreadListSkeleton.tsx` | Server | Loading skeleton |
| TypingIndicator | `TypingIndicator.tsx` | Client | Animated typing indicator |

**Key Features:**
- Server-Sent Events (SSE) streaming
- Real-time message rendering
- Thread persistence
- Optimistic UI updates

**Component Diagram:**
```
AppShell (layout)
├── ThreadListSidebar
│   ├── ThreadItem[]
│   └── CreateThread Button
└── ChatInterface
    ├── ThreadView
    │   ├── Message[]
    │   └── InputBar
    ├── EmptyThreadState
    └── ErrorThreadState
```

---

### 3. Layout Components (`src/components/layout/`)

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| MainAppShell | `MainAppShell.tsx` | Server | Main app layout with navigation |
| NavItem | `NavItem.tsx` | Client | Navigation menu item |

**Layouts:**
- **MainAppShell:** Dashboard layout (header, sidebar, content)
- **AppShell:** Chat layout (chat + thread sidebar)

---

### 4. Shared Components (`src/components/`)

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| LocaleSwitcher | `LocaleSwitcher.tsx` | Client | Language switcher (en/hi/bn) |
| Background | `Background.tsx` | Server | Gradient background |
| ActiveLink | `ActiveLink.tsx` | Client | Active route link wrapper |
| ToggleMenuButton | `ToggleMenuButton.tsx` | Client | Mobile menu toggle |

---

### 5. Feature Components

#### Auth Features (`src/features/auth/`)

| Component | Purpose |
|-----------|---------|
| SignInForm | Email/password sign-in form |
| SignUpForm | Email/password registration form |

#### Dashboard Features (`src/features/dashboard/`)

| Component | Purpose |
|-----------|---------|
| DashboardContent | Dashboard page content |
| DashboardStats | User statistics display |

#### Landing Features (`src/features/landing/`)

| Component | Purpose |
|-----------|---------|
| Hero | Landing hero section |
| Features | Features showcase |
| CTA | Call-to-action section |

---

## Component Details

### ChatInterface (`chat/ChatInterface.tsx`)

**Purpose:** Main chat UI with AI streaming

**Props:**
```typescript
interface ChatInterfaceProps {
  initialMessages?: Message[];
  conversationId?: string;
}
```

**Key Features:**
- Assistant UI runtime integration
- SSE streaming via custom adapter
- Message history loading
- Conversation persistence

**Dependencies:**
- `@assistant-ui/react` - Chat UI framework
- `@assistant-ui/react-ai-sdk` - AI SDK adapter
- Custom Dify API adapter

**State Management:**
- Built-in Assistant UI runtime
- Manages messages, streaming state
- Handles conversation context

---

### ThreadListSidebar (`chat/ThreadListSidebar.tsx`)

**Purpose:** Thread management sidebar

**Props:**
```typescript
interface ThreadListSidebarProps {
  initialThreads?: Thread[];
}
```

**Features:**
- Thread list display
- Create new thread
- Archive/unarchive threads
- Delete threads
- Title editing
- Real-time updates

**API Interactions:**
- `GET /api/threads` - Fetch threads
- `POST /api/threads` - Create thread
- `PATCH /api/threads/[id]` - Update thread
- `DELETE /api/threads/[id]` - Delete thread
- `POST /api/threads/[id]/archive` - Archive thread

---

### MainAppShell (`layout/MainAppShell.tsx`)

**Purpose:** Main application layout wrapper

**Props:**
```typescript
interface MainAppShellProps {
  children: React.ReactNode;
}
```

**Features:**
- Top navigation bar
- Sidebar navigation
- User menu
- Responsive design
- Dark mode toggle

---

## Component Patterns

### Server vs Client Components

**Server Components (Default):**
- Layouts (AppShell, MainAppShell)
- Static content (Background, EmptyState)
- Data fetching wrappers

**Client Components ("use client"):**
- Interactive UI (buttons, forms, toggles)
- Real-time features (chat, streaming)
- Browser APIs (localStorage, geolocation)

**Pattern:**
```typescript
// Server Component (default)
export function Layout({ children }) {
  return <div>{children}</div>;
}

// Client Component
'use client';
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Composition Pattern

**Example: Chat UI Composition**
```tsx
<AppShell>
  <ThreadListSidebar />
  <ChatInterface>
    <ThreadView>
      {hasMessages ? (
        <MessageList />
      ) : (
        <EmptyThreadState />
      )}
    </ThreadView>
  </ChatInterface>
</AppShell>
```

### Prop Drilling Avoidance

**Strategies:**
- React Context for global state (theme, locale)
- Assistant UI runtime for chat state
- Direct API calls from components (no prop drilling)

---

## Styling Approach

### Tailwind CSS

**Configuration:** `tailwind.config.ts`

**Custom Classes:**
```css
/* src/styles/global.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... more CSS variables */
  }
}
```

**Utility-First:**
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  Click Me
</button>
```

### Component Variants (CVA)

**Example:**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
  }
);
```

---

## Testing Strategy

### Unit Tests (Vitest)

**Test Files:** Co-located with components (`*.test.tsx`)

**Example Tests:**
- `ToggleMenuButton.test.tsx` - Button render and click
- `ThreadListSidebar.test.tsx` - Thread list rendering

**Testing Library:**
```typescript
import { render, screen } from '@testing-library/react';
import { ToggleMenuButton } from './ToggleMenuButton';

test('renders toggle button', () => {
  render(<ToggleMenuButton />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Visual Testing (Storybook)

**Story Files:** `*.stories.tsx`

**Example:**
```typescript
// Background.stories.tsx
export default {
  title: 'Components/Background',
  component: Background,
};

export const Default = () => <Background />;
```

---

## Accessibility

### WCAG 2.1 Compliance

**Features:**
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader support

**Radix UI Benefits:**
- Built-in accessibility
- Keyboard interactions
- Focus trapping (modals)
- ARIA attributes

**Example:**
```tsx
<Button
  aria-label="Close dialog"
  role="button"
  tabIndex={0}
>
  Close
</Button>
```

---

## Performance Optimization

### Code Splitting

**Automatic:**
- Route-based splitting (Next.js)
- Component lazy loading

**Manual:**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### Memoization

**React.memo for expensive renders:**
```typescript
export const ThreadItem = React.memo(({ thread }) => {
  return <div>{thread.title}</div>;
});
```

---

## Component Dependencies

### External Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `@assistant-ui/react` | 0.11.47 | Chat UI framework |
| `@radix-ui/*` | Various | UI primitives |
| `react-hook-form` | 7.53.0 | Form handling |
| `@tanstack/react-table` | 8.20.5 | Data tables |
| `lucide-react` | 0.453.0 | Icons |
| `class-variance-authority` | 0.7.0 | Component variants |
| `tailwind-merge` | 2.5.4 | Tailwind class merging |
| `clsx` | 2.1.1 | Class name utility |

---

## Future Enhancements

**Planned Components:**
- Voice input component
- Image upload for health tracking
- Progress charts and graphs
- Notification center
- User profile editor

---

**Last Updated:** 2026-01-02
**Generated by:** BMAD Document Project Workflow v1.2.0
