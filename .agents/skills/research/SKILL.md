---
name: research
description: >-
  Create a structured research brief for future PRDs and plans. Use when the
  developer asks to research a topic, invokes /research, or wants project and
  external context captured before PRD or planning work.
---

# research

Create a root-level research brief from the developer's research request.
Research briefs preserve context for future PRDs, plans, and implementation
agents.

## Usage

Use this skill for any of these forms:

```txt
$research <description>
research <description>
/research <description>
```

If the client intercepts slash commands, use `$research` or `research` instead.

## Required Behavior

1. Read and adopt both `roles/project-manager.md` and `roles/tech-lead.md`.
2. Read `templates/research-template.md`.
3. Read `project/PROJECT.md` and `project/repositories.json` to understand the
   current project purpose, repository ownership, artifact directories, and
   validation expectations.
4. Search existing `research/`, `prds/`, `plans/`, `docs/`, and relevant
   repository artifact directories for directly related saved context. Use only
   material that clearly improves this research.
5. Inspect local workspace files that are directly relevant to `<description>`.
   Use `project/repositories.json` to stay inside the appropriate ownership
   boundaries.
6. Use external sources only when the request requires current, authoritative,
   or ecosystem-specific facts. Prefer primary sources and record every URL in
   the `Reference URLs` section.
7. Analyze the topic from both product and technical perspectives:
   - Product implications, users, workflows, goals, non-goals, and acceptance
     criteria candidates.
   - Technical implications, affected repositories, integration points,
     sequencing, constraints, validation ideas, and risks.
8. Create a stable research ID using `RESEARCH-<YYYYMMDD>-<short-slug>`.
9. Save the brief in `research/<research-id-lowercase>.md`.
10. Set `Status` to `reviewed` when the brief is complete enough to inform PRD
    or planning work. Use `draft` only when material unknowns remain.
11. Do not create PRDs, create plans, or edit product code unless the developer
    explicitly asks for that as a separate step.
    When auto mode is enabled for a developer-initiated feature request, the
    active request authorizes continuation to the PRD stage under
    `.agents/skills/auto-mode/SKILL.md`.

## Output

Report the research ID, file path, status, most important recommendation, and
any high-risk unknowns that should be resolved before PRD or planning work.
