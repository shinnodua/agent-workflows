# Create Plan Command

## Metadata

- Plan ID: `PLAN-20261006-create-plan-command`
- PRD ID: `PRD-20261006-create-plan-command`
- Type: `plan`
- PRD link: [Create Plan Command](../prds/prd-20261006-create-plan-command.md)
- Research sources:
  - `RESEARCH-20261006-create-plan-command`: [Create Plan Command Research](../research/research-20261006-create-plan-command.md) - command and workflow ownership.
- Status: `approved`
- Created: `2026-10-06`
- Last updated: `2026-10-06`
- Owner: `tech-lead`
- Related artifact IDs: `[MEETING-20261006-2136-create-plan-command]`

## Title

Create plan command and skill

## Goal

Provide direct planning for approved PRDs while retaining automatic planning after PRD approval. Keep plan generation in one skill.

## Research Inputs

- Research brief: `RESEARCH-20261006-create-plan-command`
- Key planning implications: Approval and planning steps are currently combined in `approve-prd`; Codex and Claude discover commands through separate shims.
- Source gaps: `None`

## Scope

In scope:

- New `create-plan` skill, metadata, Codex prompt, Claude shim, and command spec; accept a PRD ID, path, or feature description.
- Narrow `approve-prd` to approval and a `create-plan` handoff.
- Update auto mode and workflow docs; align stale approval command description.
- Validate workspace command discovery and checks.

Out of scope:

- Product submodules, package dependencies, plan template changes, and publishing.

## Affected Platforms

Root workspace tooling only. No submodule detail plan is required.

## Cross-Repo Design

- Data contracts: Markdown PRD and plan metadata remain unchanged.
- Shared packages or APIs: `None`
- Runtime flow: `approve-prd` writes approval metadata, then invokes `create-plan`; direct `create-plan` starts at the approved-PRD gate.
- Dependency direction: plan creation depends on approved PRD status.

## Sequence

1. Create canonical `create-plan` skill by moving planning behavior from `approve-prd`.
2. Add discovery shims and command spec.
3. Update `approve-prd`, auto mode, and workflow references.
4. Validate skill metadata, command surfaces, and workspace checks.

## Validation

- Root: `bun run workspace:check`
- Check skill frontmatter and command shims.
- Check all `approve-prd` planning references point to `create-plan`.

## Risks

- Repeat invocation could duplicate or downgrade plans: require matching by PRD ID/link and preserve progressed statuses.
- Duplicated instructions could drift: keep planning detail only in `create-plan`.

## Open Questions

- Whether to update the related `.archify` diagram is pending the developer's answer.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-10-06`
- Approval command: `$auto-mode on`
