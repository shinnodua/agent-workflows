# Auto Mode Completion Handoff Plan

## Metadata

- Plan ID: `PLAN-20261001-auto-mode-completion-handoff`
- PRD ID: `PRD-20261001-auto-mode-completion-handoff`
- Type: `plan`
- PRD link: [Auto Mode Completion Handoff PRD](../prds/prd-20261001-auto-mode-completion-handoff.md)
- Research sources:
  - `RESEARCH-20261001-auto-mode-completion-handoff`: [Research brief](../research/research-20261001-auto-mode-completion-handoff.md) - Identifies the current missing handoff contract.
- Status: `complete`
- Created: `2026-10-01`
- Last updated: `2026-10-01`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261001-auto-mode-completion-handoff, MEETING-20261001-1540-auto-mode-completion-handoff]`

## Goal

Make every auto-mode coding handoff supply verified setup, compatibility, and validation facts, then produce one actionable developer summary.

## Research Inputs

- Research brief: `RESEARCH-20261001-auto-mode-completion-handoff`
- Key planning implications:
  - The reusable template belongs in root `templates/`.
  - The auto-mode skill owns final summary behavior.
  - Role guidance and workflow documentation must point to the same template.
- Source gaps: None.

## Scope

In scope:

- Add the canonical completion summary template.
- Require it in auto-mode skill, root agent guidance, implementation handoffs, and workflow documentation.
- Update the existing workspace workflow diagram completion section, as requested by the developer.
- Validate root workspace files and diagram artifact.

Out of scope:

- Product repositories, deployment, and secret creation.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| Root workspace | Reusable workflow instructions and diagram | This plan |

## Cross-Repo Design

- Data contracts: Markdown template fields for repository agents and the coordinator.
- Shared packages or APIs: None.
- Runtime flow: Implementers return applicable verified facts; coordinator reconciles them and publishes ordered developer actions.
- Dependency direction: Template first, references second, diagram and validation last.

## Sequence

1. Create `templates/auto-mode-completion-summary-template.md` with Build, Run, Roll out actions and supporting evidence.
2. Update auto-mode and root workflow instructions; link role handoffs to the template.
3. Refresh the existing workflow diagram completion card.
4. Run root validation and diagram checks.

## Validation

- Root: `bun run workspace:check`; inspect template references and final diff.
- Diagram: Archify validation and generation for the existing candidate.
- Completed: `bun run workspace:check` passed; `npm pack --dry-run --json` with a temporary writable npm cache included the new template. Archify `validate`, `deliver`, and provenance `check` passed. Its browser check could not complete because the local Chrome DevTools read pipe closed before returning measurements.

## Risks

- A generic report may invent deployment settings; require verified `None` or `Unknown` with owner and missing fact.
- Multiple repositories may disagree about a shared setting; coordinator reconciles or flags the conflict.

## Open Questions

- None.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-10-01`
- Approval command: `$auto-mode on`
