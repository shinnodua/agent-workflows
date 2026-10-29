# Research: Dashboard Workflow Kanban

## Metadata

- Research ID: `RESEARCH-20261013-dashboard-workflow-kanban`
- Title: `Dashboard workflow Kanban`
- Type: `research`
- Status: `reviewed`
- Created: `2026-10-13`
- Last updated: `2026-10-13`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261013-dashboard-workflow-kanban]`
- Source request: `Improve dashboard task visibility with draggable workflow columns that follow workspace workflow rules.`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

The dashboard already groups linked PRD, plan, design, and research artifacts into tasks. A workflow Kanban can reuse that concept, but stage location must reflect evidence and approval gates rather than simply changing every artifact's status. Dragging must not fabricate completed work or bypass review.

## Short Version

Use Research, PRD, Design, Planning, Implementation, Validation, and Complete columns. Keep review and approval requirements visible within these columns. The developer confirmed that a valid drop launches the corresponding agent workflow.

## Research Questions

- What task grouping and progress evidence exist?
- Which workspace rules constrain movement between columns?
- What scope decision remains for drag actions?

## Context

The user chose workflow columns and draggable cards. This is local coordination tooling owned by the root workspace. The project profile contains example repository entries and does not identify a product repository for this feature.

## Current Workspace Findings

- [Task overview](../dashboard/src/features/task-status/components/TaskOverview/TaskOverview.tsx) shows task cards and links to underlying artifacts.
- [Artifact grouping](../dashboard/src/features/task-status/utils/artifactGrouping.ts) joins artifacts by task keys and related IDs. Filtering currently occurs before grouping, so a narrow search can remove evidence from a visible group.
- [Lifecycle presentation](../dashboard/src/features/task-status/utils/lifecycle.ts) lists seven stages. Implementation and validation are inferred from phrases in document contents; this alone is insufficient authority for a writable transition or verified completion.
- [Workspace workflows](../workflows.md) require PRD approval before planning and plan approval before implementation. Auto mode requires research, applicable design, and sprint review before PRD approval. Manual mode allows optional research, design, and meeting stages.
- [Auto-mode skill](../.agents/skills/auto-mode/SKILL.md) enables internal approvals and continuation but excludes commits, pushes, releases, deployments, and production changes.
- No directly relevant existing saved research brief was found.

## External Findings

None. These findings concern local workflow rules and repository behavior.

## Reference URLs

None.

## Product Implications

- Users: developers and coordinators inspecting tasks across workspace artifacts.
- Goals: show progress, blockers, prerequisites, and valid next actions at a glance.
- Non-goals: changing workflow policy, inventing completion evidence, or introducing product runtime functionality.
- UX: show blocked reasons within a stage; expose review and approval gates without requiring extra board columns.

## Technical Implications

- Affected repository: root workspace dashboard and its local tooling only.
- Contracts: preserve artifact identities, links, per-artifact statuses, and compatibility with legacy metadata.
- Writable behavior needs validated prerequisites, stale-data protection, restricted workspace ownership, and persistence failure recovery.
- Evaluate full task evidence independently of search results.
- The developer explicitly chose agent execution. Planning must verify a supported local execution capability and define task progress, duplicate-run prevention, stop behavior, and approval handling.

## Options

- Record permitted transitions: smaller local-tooling scope; requires persistence and evidence validation; does not perform missing work.
- Launch workflow actions: can perform missing work but requires agent execution, progress reporting, cancellation, and approval handling.

## Recommendation

Follow the developer's selected agent-execution approach. Require evidence-backed entry and exit gates, visible run progress, duplicate-run prevention, and mode-appropriate approval handling. Treat a workflow start as active work, never as proof of completion.

## Risks And Mitigations

- Artifact status is not task progress: distinguish approval, stage activity, and verified completion.
- Search may hide prerequisites: resolve progress from the full related task before filtering visible cards.
- Legacy or conflicting metadata: explain uncertainty and prevent unsupported transitions.
- Concurrent agent edits: reject stale transitions and preserve changes.

## Highest-Risk Unknowns Or Clarifications Needed

- Which supported local agent execution capability can launch and track these workflows? Resolve from repository evidence during planning.
- Does this create-prd request end at the draft or continue through the enabled auto-mode pipeline?

## Validation Ideas

- Exercise every permitted and prohibited path in manual and auto modes.
- Verify search does not change stage placement or transition eligibility.
- Verify missing evidence, stale edits, failed writes, and unavailable submodules preserve source files and board state.
- Verify keyboard movement, touch alternatives, document opening, and responsive board navigation.

## Open Questions

See highest-risk unknowns above.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: draggable workflow Kanban with evidence-backed gates.
- Suggested affected platforms: root local dashboard.
- Suggested acceptance criteria: one card per grouped task, stable stage placement, explained invalid drops, and persisted valid actions.
- Suggested sequencing: complete PRD and design review, verify agent execution capability in planning, then implement approved scope.
- Dependencies: source workflow rules and artifact evidence.
