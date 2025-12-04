# Story 1.5: Implement User Workflows

**Status:** Draft

---

## User Story

As a user,
I want to trigger specific health coaching workflows,
So that I can get structured guidance for common health goals.

---

## Acceptance Criteria

**AC #1:** Workflow menu button is visible in chat interface
**AC #2:** Clicking workflow menu displays available workflows
**AC #3:** Each workflow can be triggered by user selection
**AC #4:** Workflow parameters are collected correctly (if workflow requires inputs)
**AC #5:** Workflow executes and returns structured results
**AC #6:** Workflow results display in chat as formatted messages
**AC #7:** Workflow execution errors are caught and display user-friendly messages
**AC #8:** At least 2-3 workflows are functional (e.g., Goal Setting, Nutrition Planning)

---

## Implementation Details

### Tasks / Subtasks

**Dify Workflow Configuration:**
- [ ] Log in to Dify Cloud dashboard (AC: #8)
- [ ] Navigate to Workflows section (AC: #8)
- [ ] Create "Goal Setting" workflow in Dify workflow builder (AC: #8)
- [ ] Create "Nutrition Planning" workflow in Dify workflow builder (AC: #8)
- [ ] (Optional) Create third workflow based on health coach needs (AC: #8)
- [ ] Test each workflow in Dify Playground (AC: #5, #8)
- [ ] Note workflow IDs for API integration (AC: #3)

**Backend Implementation:**
- [ ] Create app/api/chat/workflows/route.ts - workflow trigger endpoint (AC: #3)
- [ ] Implement session validation in workflows endpoint (AC: #3)
- [ ] Implement Dify workflow API calls using dify-client (AC: #3, #5)
- [ ] Handle workflow parameters from client (AC: #4)
- [ ] Add error handling for workflow failures (AC: #7)
- [ ] Add logging for workflow executions (AC: #5)

**Frontend Implementation:**
- [ ] Create app/[locale]/(chat)/components/WorkflowMenu.tsx - workflow selection UI (AC: #1, #2)
- [ ] Create components/chat/WorkflowButton.tsx - individual workflow trigger (AC: #1)
- [ ] Add workflow menu button to chat interface (AC: #1)
- [ ] Implement workflow selection modal/dropdown (AC: #2)
- [ ] Connect workflow triggers to /api/chat/workflows endpoint (AC: #3)
- [ ] Display workflow results in chat as formatted messages (AC: #6)
- [ ] Add loading state during workflow execution (AC: #5)
- [ ] Display error messages for failed workflows (AC: #7)

**Workflow Parameter Handling:**
- [ ] Design parameter collection UI (forms, inputs) (AC: #4)
- [ ] Validate required parameters before submission (AC: #4)
- [ ] Pass parameters to workflow API (AC: #4)
- [ ] Handle workflow responses with collected data (AC: #5, #6)

**Styling & UX:**
- [ ] Style workflow menu button (consistent with chat UI) (AC: #1)
- [ ] Style workflow selection interface (AC: #2)
- [ ] Format workflow results for readability (AC: #6)
- [ ] Add icons or visual indicators for workflows (AC: #2)
- [ ] Make workflow UI responsive (mobile, tablet, desktop) (AC: #1, #2)

**Testing:**
- [ ] Write integration test for /api/chat/workflows endpoint (AC: #3, #5)
- [ ] Write E2E test for workflow trigger flow (AC: #10)
- [ ] Manual test: Trigger each workflow and verify results (AC: #8)
- [ ] Manual test: Error handling when workflow fails (AC: #7)
- [ ] Manual test: Parameter collection and submission (AC: #4)

### Technical Summary

Create workflow trigger system with backend API endpoint and frontend UI components. Configure 2-3 health coaching workflows in Dify's workflow builder and integrate them into the chat application.

**Key Technical Decisions:**
- Workflows defined in Dify workflow builder (no-code)
- Backend endpoint `/api/chat/workflows` triggers Dify workflows via API
- Frontend WorkflowMenu component displays available workflows
- Results displayed as formatted chat messages using Assistant-UI

**Workflow Architecture:**
```
User clicks workflow button
  ↓
  WorkflowMenu displays options
  ↓
  User selects workflow
  ↓
  POST /api/chat/workflows { workflowId, parameters }
  ↓
  Validate session
  ↓
  Call Dify Workflow API
  ↓
  Dify executes workflow steps
  ↓
  Return structured result
  ↓
  Display in chat interface
```

**Example Workflows:**
1. **Goal Setting** - Help user define SMART health goals
2. **Nutrition Planning** - Create personalized meal plan guidance
3. **Fitness Assessment** - Evaluate current fitness level and recommend plan

### Project Structure Notes

- **Files to create:**
  - app/api/chat/workflows/route.ts
  - app/[locale]/(chat)/components/WorkflowMenu.tsx
  - components/chat/WorkflowButton.tsx

- **Files to modify:**
  - app/[locale]/(chat)/page.tsx (add workflow menu)
  - components/chat/ChatInterface.tsx (integrate workflow UI)

- **Expected test locations:**
  - tests/integration/api/workflows.test.ts (new)
  - tests/e2e/workflows.spec.ts (new)

- **Estimated effort:** 3 story points (2-3 days)

- **Prerequisites:**
  - Stories 1.2, 1.3 completed (proxy + chat UI functional)
  - Health coach input on desired workflows
  - Dify Cloud account with workflow builder access

### Key Code References

**Workflow API Endpoint Pattern:**
```typescript
// app/api/chat/workflows/route.ts
import { DifyClient } from '@/lib/dify/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Validate session
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract workflow details
  const { workflowId, parameters } = await request.json();

  // Call Dify Workflow API
  const dify = new DifyClient(process.env.DIFY_API_KEY!);
  const result = await dify.executeWorkflow({
    workflow_id: workflowId,
    inputs: parameters,
    user: user.id,
  });

  return Response.json(result);
}
```

**WorkflowMenu Component Pattern:**
```typescript
// Workflow selection UI with available workflows
const workflows = [
  { id: 'goal-setting', name: 'Goal Setting', icon: '🎯' },
  { id: 'nutrition-plan', name: 'Nutrition Planning', icon: '🥗' },
]

function WorkflowMenu() {
  return (
    <div>
      {workflows.map(w => (
        <WorkflowButton key={w.id} workflow={w} onClick={handleTrigger} />
      ))}
    </div>
  )
}
```

**Tech-Spec References:**
- See tech-spec.md "Integration Points" → "Dify Cloud ↔ Workflows"
- See tech-spec.md "Technical Details" → "Workflow Trigger Flow"
- See tech-spec.md "Source Tree Changes" for file locations

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:
- Complete workflow integration architecture
- Dify workflow API patterns
- Workflow trigger UI/UX specifications
- Error handling for workflows

**Architecture:** See tech-spec.md "Integration Points" → "Dify Cloud ↔ Workflows"

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
