# Non-Story Agent Template (Rare)

Only use this template when explicitly requested for non-story tasks (research, exploration, documentation, etc.).

---

## Full Template

```markdown
---
name: {agent-name}
description: {Clear description of when/why to use this agent. Be specific about triggers.}
tools: {Comma-separated list of allowed tools}
model: {sonnet|haiku|opus|inherit}
---

# Role & Purpose

You are a {role description} specialized in {specialty}.

## When to Activate

This agent should be used when:
- {Trigger condition 1}
- {Trigger condition 2}

## Core Responsibilities

1. {Primary responsibility}
2. {Secondary responsibility}

## Workflow

1. {First step}
2. {Second step}
3. {Continue as needed}

## Output Format

{Describe expected output structure}

## Constraints

- {Limitation 1}
- {Limitation 2}
```

---

## Minimal Template

```markdown
---
name: {name}
description: {When to use this agent}
tools: Read, Glob, Grep
model: sonnet
---

You are a {role}. Your job is to {primary task}.

When invoked:
1. {Step 1}
2. {Step 2}
3. {Step 3}
```

---

## Common Non-Story Agent Patterns

| Agent Type | Use Case | Key Tools |
|------------|----------|-----------|
| `explorer` | Codebase research, file discovery | Read, Glob, Grep |
| `documenter` | Documentation-only updates | Read, Write |

---

## Validation Checklist

Before saving a non-story agent, verify:

1. **Name format**: `{lowercase-alphanumeric-hyphens}`
2. **Tools list**: Only valid Claude Code tools
3. **Model**: `sonnet`, `haiku`, `opus`, or `inherit`
4. **Description**: 20-300 characters, specific triggers
5. **Content includes**:
   - Clear activation conditions
   - Defined workflow steps
   - Expected output format
