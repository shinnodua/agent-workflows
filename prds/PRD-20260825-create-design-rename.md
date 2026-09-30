# Create Design Rename PRD

## Metadata

- PRD ID: `PRD-20260825-create-design-rename`
- Title: `Create Design Rename`
- Type: `prd`
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-25`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `rename the UI/UX design skill and command to create-design`
- Research sources:
  - `None`: No saved research was required; implementation is based on repository inspection.

## Problem

The UI/UX design workflow command uses a legacy name that is less consistent
with the workspace's action-oriented command names such as `create-prd` and
`create-diagram`.

## Research Context

- Research brief: `None`
- Key findings used:
  - Workspace command behavior is stored in `.agents/skills/<command>/SKILL.md`
    with `.codex/prompts/` and `commands/` shims.
  - Workflow documentation and the dashboard command guide also list command
    names.
- Source gaps:
  - `None`

## Goals

- Rename the design skill and command to `create-design`.
- Keep the skill folder, Codex slash prompt, command shim, workflow docs, and
  dashboard command labels consistent.

## Non-Goals

- Change the underlying design workflow behavior.
- Add new product code or dependencies.

## Users And Use Cases

- User: `developer`
- Use case: `Invoke the design workflow with /create-design, $create-design, or
  create-design and see the same name reflected in docs and dashboard guidance.`

## Requirements

Functional requirements:

- The skill folder is `.agents/skills/create-design/`.
- The skill frontmatter name is `create-design`.
- The Codex prompt shim is `.codex/prompts/create-design.md`.
- The command spec is `commands/create-design.md`.
- Workflow docs and dashboard command guidance reference `create-design`.

Non-functional requirements:

- Preserve existing design workflow behavior.
- Keep changes root-owned and avoid submodule edits.

## User Flows

1. Developer runs `/create-design <design request>`.
2. Codex delegates to `$create-design`.
3. The `create-design` skill performs the existing design workflow.

## Affected Platforms

- `workspace-root`: Skill, command shim, Codex prompt shim, workflow docs, PRD,
  and dashboard workflow labels.

## Data, API, And Package Contracts

- Shared types or packages: No package contract changes.
- API endpoints: No backend API changes.
- Events or runtime interfaces:
  - Skill command forms: `$create-design`, `create-design`, `/create-design`.
- Compatibility requirements:
  - The old design command files are renamed rather than duplicated.

## UX Notes

The dashboard and workflow docs should show the new command name consistently
without changing the role, output, or design artifact behavior.

## Acceptance Criteria

- No repository references to the old design command name remain.
- The renamed skill validates successfully.
- Workspace validation passes, or any validation failure is reported.

## Risks And Tradeoffs

- Risk: Existing users may remember the old command. Mitigation: keep the
  behavior unchanged and document the new canonical command consistently.

## Open Questions

- `None`

## Design Artifacts

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`
