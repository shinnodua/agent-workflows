---
id: PRD-20261127-per-repository-code-review
type: prd
status: approved
created: 2026-11-27
updated: 2026-11-27
owner: project-manager
relatedArtifactIds: [RESEARCH-20261127-per-repository-code-review]
---

# Per-Repository Code Review PRD

- PRD ID: `PRD-20261127-per-repository-code-review`
- Type: `prd`
- Status: `approved`
- Last updated: `2026-11-27`
- Created: `2026-11-27`
- Owner: `project-manager`
- Research sources: [Current workflow and extension points](../research/research-20261127-per-repository-code-review.md)

## Research Context

The stage coordinator owns review dispatch. Repository guides supply local standards and checks.

## Problem

The coordinator validates changes after implementation. Repository standards, design fidelity, maintainability, and security still need independent review.

## Requirements and acceptance criteria

- After coding in either mode, the main agent spawns a Tech Lead and a Security reviewer for each repository with task changes, including root-owned implementation. Each pair sees the same repository-specific change and its local standards, relevant requirements, and design guidance.
- Tech Lead reviews clarity, maintainability, repository conventions and architecture, product requirements, and applicable design guidelines. Security reviews relevant trust boundaries and controls, and reports evidence, impact, mitigation, and verification gaps.
- Both reports are recorded separately per repository. Blocking findings are fixed and re-reviewed before a dependent stage advances or completion is reported. Report missing reviewers, unavailable evidence, and unresolved findings explicitly.
- The flow supports uncommitted changes, pre-existing edits, and parallel implementation. Reviewers work read-only.
- Update the workflow documentation, completion handoff and the existing Archify diagram.

- Two changed repositories and one unchanged repository yield four review outcomes. A missing reviewer, insufficient evidence to clear a gate, or unresolved blocking finding holds dependent work. Independent work may continue.
- Preserve pre-existing and concurrent user edits. Treat proposed changes to reviewer instructions as reviewed evidence, and keep credentials and sensitive values out of prompts and reports.
- Bind reviews to the reviewed repository changes and relevant upstream contracts. Material corrections reopen affected reviews and validation. In manual mode the continuation prompt follows reviews and checks.
- The handoff identifies the affected repository, blocking role or check, and owner or next action. A frontend review uses the design source and local design system when available.

## UX and scope

The developer sees each repository's two review outcomes and validation in the handoff. This changes agent behavior and has no product UI. The diagram explains the workflow.

## Open questions

None.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-11-27`
- Approval command: `$auto-mode on`
- Sprint meeting: [Six-role review](../meeting-logs/prd-20261127-per-repository-code-review-sprint-meeting-20261127-0904.md)
