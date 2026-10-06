# Create Plan Command

## Metadata

- PRD ID: `PRD-20261006-create-plan-command`
- Title: Create plan command and skill
- Type: `prd`
- Status: `approved`
- Created: `2026-10-06`
- Last updated: `2026-10-06`
- Owner: `project-manager`
- Related artifact IDs: `[RESEARCH-20261006-create-plan-command, MEETING-20261006-2136-create-plan-command]`
- Source request: `Extract from approve PRD skill and create the create-plan skill and command, then use it directly or after PRD approval.`
- Research sources:
  - `RESEARCH-20261006-create-plan-command`: [Create Plan Command Research](../research/research-20261006-create-plan-command.md) - current workflow and command surfaces.

## Problem

Plan creation is embedded in PRD approval, so users cannot invoke planning as a distinct command for an already approved PRD.

## Research Context

- Research brief: `RESEARCH-20261006-create-plan-command`
- Key findings used: approval and planning share one skill today; commands have Codex and Claude shims.
- Source gaps: `None`

## Goals

- Provide `$create-plan <prd-id-or-path-or-description>` as a direct planning command.
- Preserve automatic plan creation after `$approve-prd`.
- Keep plan creation behavior in one canonical skill.

## Non-Goals

- Change the plan template, implement product code, or alter plan approval.

## Users And Use Cases

- User: workspace developer. Use case: create or resume plans for an approved PRD.
- User: approval agent. Use case: invoke the same planning skill after approving a PRD.

## Requirements

Functional requirements:

- The new skill accepts a PRD ID or path and verifies `Status: approved` before planning.
- A description selects an unambiguous matching PRD or starts a draft PRD; planning waits for approval in manual mode and follows required PRD stages in auto mode.
- It creates a draft root plan and affected submodule plans following existing ownership, research, linking, delegation, and validation conventions.
- The approval skill delegates to `create-plan` after approval instead of duplicating planning instructions.
- Add command, Codex prompt, Claude shim, and skill metadata consistent with existing commands.
- Auto mode and workflow docs present approval and plan creation as separate stages.
- Direct re-invocation reuses existing matching plans rather than creating duplicates.
- Match existing plans by PRD ID and link, complete incomplete draft plans while preserving their IDs, and do not overwrite or downgrade approved plans.
- For missing, ambiguous, superseded, or unapproved PRDs, report the path/status when known and a useful next action without creating plans or changing PRD approval.

Non-functional requirements:

- Keep changes in the root workspace and preserve existing plan IDs and links.

## User Flows

1. User approves a PRD or selects one already approved.
2. User or approval agent invokes `create-plan` with its PRD ID.
3. Agent verifies approval, creates or completes draft plans, and reports their paths.
4. On repeat invocation, agent reports which plans were created, completed, or reused.

## Affected Platforms

- Root workspace tooling: command and skill files, workflow documentation.

## Data, API, And Package Contracts

- Shared types or packages: `None`
- API endpoints: `None`
- Events or runtime interfaces: command invocation text and Markdown artifact metadata.
- Compatibility requirements: existing `$approve-prd` invocation continues to create plans.

## UX Notes

- Command descriptions should make the approved PRD prerequisite clear.
- No visual design is applicable: this adds a text command and skill, not a user interface.

## Acceptance Criteria

- `$create-plan <approved-prd-id>` is discoverable and described in workflow docs.
- The command accepts a PRD ID, path, or feature description and is exposed through the canonical skill, Codex prompt, Claude shim, and compatibility command spec.
- Calling `approve-prd` leads to the same planning skill.
- A non-approved or superseded PRD cannot be planned through `create-plan`; the PRD and plans remain unchanged and the user sees the status and next action.
- Repeated invocation reuses matching plans without duplicate IDs or downgrading approved plans.
- Auto mode invokes `create-plan` as a distinct stage after PRD approval.
- Output lists the PRD, root plan, submodule plan paths, statuses, and open planning questions.
- Root workspace checks pass.

## Risks And Tradeoffs

- Duplicated planning instructions could drift; keep them only in `create-plan`.
- Repeat invocation could duplicate plans; require reuse of matching artifacts.

## Open Questions

- None.

## Design Artifacts

- None; text-only workflow.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-10-06`
- Approval command: `$auto-mode on`
