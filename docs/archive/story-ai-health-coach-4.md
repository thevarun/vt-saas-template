# Story 1.4: Set Up Dify Knowledge Base

**Status:** Draft

---

## User Story

As a health coach,
I want the AI to be trained on my expertise,
So that users receive accurate guidance based on my proven methodologies.

---

## Acceptance Criteria

**AC #1:** Health coach content uploaded to Dify knowledge base
**AC #2:** Content is properly chunked and embedded in Dify
**AC #3:** Test queries retrieve relevant information from knowledge base
**AC #4:** AI responses cite health coach methodology and frameworks
**AC #5:** Knowledge base is searchable and retrieves context correctly
**AC #6:** Agent persona configured to sound like health coach
**AC #7:** Sample health questions return appropriate, expert-level responses

---

## Implementation Details

### Tasks / Subtasks

**Content Preparation:**
- [ ] Gather health coach expertise materials (documents, guides, frameworks) (AC: #1)
- [ ] Convert content to digestible formats (Markdown, PDF, TXT) (AC: #1)
- [ ] Organize content by topic (nutrition, fitness, wellness, etc.) (AC: #1)
- [ ] Review content for quality and completeness (AC: #1)

**Dify Knowledge Base Setup:**
- [ ] Log in to Dify Cloud dashboard (AC: #1)
- [ ] Create or access HealthCompanion chat app in Dify (AC: #1)
- [ ] Navigate to Knowledge Base section (AC: #1)
- [ ] Upload health coach content files (AC: #1)
- [ ] Configure chunking settings (recommended: 500-1000 characters) (AC: #2)
- [ ] Configure embedding model (use Dify default or customize) (AC: #2)
- [ ] Wait for indexing to complete (AC: #2)
- [ ] Verify all content properly embedded (check status) (AC: #2)

**Agent Persona Configuration:**
- [ ] Configure agent system prompt to embody health coach persona (AC: #6)
- [ ] Set agent name and description (AC: #6)
- [ ] Configure response style (friendly, expert, supportive) (AC: #6)
- [ ] Add knowledge base as context source for agent (AC: #5)

**Testing & Validation:**
- [ ] Test in Dify Playground: Ask sample health questions (AC: #3)
- [ ] Verify responses pull from knowledge base content (AC: #3, #4)
- [ ] Test edge cases: topics not in knowledge base (AC: #5)
- [ ] Validate agent tone matches health coach personality (AC: #6)
- [ ] Create list of 10-15 test questions covering different topics (AC: #7)
- [ ] Run all test questions, verify quality responses (AC: #7)
- [ ] Document any gaps in knowledge base coverage (AC: #7)

**Integration with App:**
- [ ] Test knowledge base via app's /api/chat endpoint (AC: #5)
- [ ] Verify responses in actual chat interface match Dify playground (AC: #5)
- [ ] Ask follow-up questions to test conversation context (AC: #5)

**Documentation:**
- [ ] Document knowledge base structure and content types (AC: #1)
- [ ] Document how to update knowledge base in future (AC: #1)
- [ ] Create FAQ for common questions (optional, future reference) (AC: #7)

### Technical Summary

Upload health coach expertise to Dify's knowledge base system and configure the AI agent persona. This is primarily a no-code task performed in the Dify dashboard UI, with validation testing via the chat application.

**Key Technical Decisions:**
- Use Dify's managed knowledge base (no custom RAG implementation)
- Dify handles chunking, embedding, and retrieval automatically
- Configure agent persona via Dify system prompts
- No application code changes needed (all Dify configuration)

**Knowledge Base Architecture:**
```
Health Coach Content (Markdown/PDF/TXT)
  ↓
  Upload to Dify Dashboard
  ↓
  Dify chunks and embeds content
  ↓
  Indexed in Dify's vector database
  ↓
  Agent retrieves context via RAG
  ↓
  Responses grounded in expertise
```

### Project Structure Notes

- **Files to create:**
  - None (all work in Dify dashboard)

- **Files to modify:**
  - None (configuration only)

- **Content to prepare:**
  - Health coach methodology documents
  - Nutrition guidelines
  - Fitness frameworks
  - Wellness best practices
  - FAQs and common scenarios

- **Expected test locations:**
  - Dify Playground (for initial testing)
  - App chat interface (for integration testing)

- **Estimated effort:** 3 story points (2-3 days, mostly content prep and testing)

- **Prerequisites:**
  - Story 1.2 completed (Dify proxy functional)
  - Health coach content gathered and prepared
  - Dify Cloud account with chat app created

### Key Code References

**No application code required** - This story is primarily content and configuration work in the Dify dashboard.

**Dify Configuration References (from tech-spec.md):**
- See tech-spec.md "Integration Points" → "Dify Cloud ↔ Knowledge Base"
- Content upload via Dify dashboard UI
- Automatic chunking and embedding by Dify
- RAG pipeline managed by Dify

**Testing Approach:**
- Initial testing in Dify Playground before integrating
- Integration testing via /api/chat endpoint
- See tech-spec.md "Technical Details" → "Chat Message Flow"

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:
- Dify knowledge base integration architecture
- Content upload and configuration guidance
- Testing strategy for knowledge base validation
- Agent persona requirements

**Architecture:** See tech-spec.md "Integration Points" → "Dify Cloud ↔ Knowledge Base"

**Sample Test Questions:**
1. "What are healthy protein sources for breakfast?"
2. "How do I set a realistic fitness goal?"
3. "What's the best way to stay hydrated during exercise?"
4. "How can I improve my sleep quality?"
5. "What are some stress management techniques?"

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
