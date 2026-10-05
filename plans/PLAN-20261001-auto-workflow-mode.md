# Auto Workflow Mode Plan

## Metadata

- Plan ID: `PLAN-20261001-auto-workflow-mode`
- PRD ID: `PRD-20261001-auto-workflow-mode`
- Type: `plan`
- PRD link: [Auto Workflow Mode PRD](../prds/PRD-20261001-auto-workflow-mode.md)
- Research sources:
  - `None`: Existing workspace files were inspected directly.
- Status: `complete`
- Created: `2026-10-01`
- Last updated: `2026-10-01`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261001-auto-workflow-mode]`

## Goal

Add a persistent opt-in auto mode and make the reusable agent workflow advance
through the requested stages without routine developer approvals.

## Research Inputs

- Research brief: `None`
- Key planning implications:
- `workspace.config.json` is the source of truth for workspace settings; older
  `.agent-workflows/metadata.json` state needs a one-time migration.
  - `bin/workflows.js` owns CLI entry points and packaged discovery shims.
  - Skills own stage behavior; workflow guidance must tell agents to read the
    setting and apply the auto path.
- Source gaps:
  - `None`

## Scope

In scope:

- CLI state control and preservation during update.
- New agent command and auto workflow skill for stage orchestration.
- Conditional continuation in existing stage skills and workflow documentation.
- CLI tests and workspace validation.

Out of scope:

- Product submodules, dashboard UI, commits, and releases.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| Root workspace | Reusable CLI, skills, command shims, templates, and docs | This plan |

## Cross-Repo Design

- Data contracts: `workspace.config.json` stores `autoMode.enabled`; legacy metadata migrates to it.
- Shared packages or APIs: None.
- Runtime flow: Agent reads state; if enabled and a feature request is active,
  it runs the ordered workflow and resumes after human-only answers.
- Dependency direction: CLI state read/write is independent of product repos.

## Sequence

1. Add an atomic CLI toggle and status reader for `workspace.config.json`.
2. Add the auto-mode skill and Codex, Claude, and command shims.
3. Update stage skills, workflow rules, templates, and user documentation.
4. Test CLI persistence and update preservation; run workspace checks.

## Validation

- Root: `bun run workspace:check`, focused CLI tests, and skill validation.
- Completed: `bun run workspace:check` passed; two CLI tests and skill validation
  passed. The refreshed interactive diagram passed Archify validation, delivery,
  and provenance checks. Archify's browser gate could not complete because the
  local Chrome DevTools pipe closed before returning measurements.

## Risks

- A managed workspace file could reset the setting; store it separately from
  managed source files and test update preservation.
- Instruction conflicts could halt the auto path; make each existing gate state
  its auto-mode behavior explicitly.

## Open Questions

- None

## Approval

- Approved by: `developer`
- Approved on: `2026-10-01`
- Approval command: `Direct implementation request`
