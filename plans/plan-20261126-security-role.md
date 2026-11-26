# Security Role And Review Implementation Plan

## Metadata

- Plan ID: `PLAN-20261126-security-role`
- PRD ID: `PRD-20261126-security-role`
- Type: `plan`
- PRD link: [PRD](../prds/prd-20261126-security-role.md)
- Research sources:
  - [RESEARCH-20261126-security-role](../research/research-20261126-security-role.md) - Registry, discovery, and meeting findings.
- Status: `complete`
- Created: `2026-11-26`
- Last updated: `2026-11-26`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261126-security-role, RESEARCH-20261126-security-role]`

## Title

Security role and artifact review integration

## Goal

Make Security discoverable, model-configurable, present in sprint meetings, and directly callable for domain-aware reviews without changing approval authority.

## Research Inputs

The linked research and sprint meeting identify explicit CLI registration, default migration, runtime agent shims, standalone review orchestration, and template updates. No external sources or dependency changes are needed to implement this workflow.

## Scope

In scope: root role/agent files; security-review skill and command/runtime shims; CLI registry/defaults; meeting skill/template; workflow/README documentation; installation and migration tests.

Out of scope: product code, dependency changes, live audits, automatic fixes, release/publish.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| Root workspace | All changes | This plan; no submodule plan required |

## Cross-Repo Design

No cross-repository runtime contract changes. Use role ID security and agent name workspace-security. Reuse existing managed path discovery. Resolve Security model by target: research → research, PRD → prd, plan → planning, code/general solution → validation; meetings → meeting. Role guidance owns review coverage; security-review owns target selection and invocation.

## Sequence

1. Register security and default runtime models, create source role and shared/Claude agents.
2. Add review skill, Codex prompt, Claude skill shim, command shim, and UI metadata.
3. Add sixth meeting participant, question routing, required security findings, template sections, and bounded batches.
4. Document commands and configuration; update related Archify artifacts only if developer accepts the requested refresh.
5. Test init/update, default migration, preserved custom choices, runtime sync, and step override precedence. Run workspace checks and skill validators.

## Validation

- Root: bun run workspace:check.
- Skill: bundled quick_validate.py for new security-review and updated sprint-meeting.
- Integration: temporary consuming workspaces for init/update/sync/model resolution and shim discovery.
- Product submodules: none affected.

## Risks

- Drift between registry and discovery files: integration tests exercise both.
- False assurance: require scope, confidence, and current evidence limits.
- Bounded meetings: batch by available slots while preserving every role and active budget.

## Open Questions

None. The developer requested continuation and the existing workflow diagram was refreshed in place.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-11-26`
- Approval command: `$auto-mode on`

## Completion Handoff

### 1. Developer actions

- Build: None for this source change; workspace checks and the dashboard build passed.
- Run: Reload the agent session to discover the new role and skill. In an existing consuming workspace, run `bunx workflows update` after installing a package version containing this change, then reload. That future package version is not published by this task.
- Roll out: None for product runtimes; no deployment or migration is required.

### 2. Artifacts created and approved

- Research: [RESEARCH-20261126-security-role](../research/research-20261126-security-role.md), reviewed.
- PRD: [PRD-20261126-security-role](../prds/prd-20261126-security-role.md), approved under auto mode.
- Design: Not applicable; no product UI surface.
- Sprint meeting: `MEETING-20261126-1215-security-role` in [meeting logs](../meeting-logs/), complete. Security did not exist yet.
- Root plan: This plan, complete; approval authority recorded above.
- Affected repository plans: None; root-only change.

### 3. Implementation summary

- Root workspace: Added [Security role](../roles/security.md), shared/Claude agents, security-review skill and runtime/command shims; registered Security models in CLI/configuration; added Security to sprint meeting and auto-mode guidance and meeting log template.
- Integration: Existing managed-path discovery and model precedence support Security; no new dependency or workflow step.
- All new reusable instructions are in English.

### 4. Breaking changes and compatibility

- Breaking changes: None to product contracts or configured model values. Meetings now require a sixth participant.
- Compatibility and rollout order: Existing consumers receive new files/defaults through workflows update after upgrading the package; reload sessions afterward.
- Unknowns: No released version containing this change exists from this task; release ownership stays with the developer.

### 5. Environment and operational configuration

- Settings: Added `agentModels.security` with `inherit` for Codex, Antigravity, and Claude; existing `workflowModels` precedence applies. No new environment variables or secret values.
- Migrations and backfills: None for product data; CLI update backfills missing role defaults.
- API and client rollout order: None.
- Rollback or downtime considerations: No product runtime deployment or downtime.

### 6. Validation results

- `bun run workspace:check`: passed; 16 CLI tests, 26 add-project tests, 5 staged-security tests, 34 dashboard tests; lint, dashboard typecheck, and dashboard build passed.
- Integrity: 45 artifacts, 0 errors, 1 pre-existing unresolved artifact reference in the add-project PRD. Dashboard build also reports a bundle-size warning.
- Skill validation: security-review and sprint-meeting passed the bundled quick validator.
- Build and runtime evidence: Local CLI integration tests exercised init, legacy update, preserved settings, model override resolution, and runtime sync in temporary consumers. Local dashboard production build passed.
- Limits: No live product security audit, external service, or production runtime was exercised; model configuration tests do not prove future model review quality.
- Diagram: Updated the existing [workflow HTML](../.archify/workflow-workspace-delivery-20260929-093455/workspace-delivery.html) and candidate in place, including six-role meetings and an independent advisory Security path; synchronized the inline Mermaid. Archify finalize passed showcase validation, delivery, strict artifact checks, and automated Chrome checks with zero diagnostics. Perceptual screenshot review was not requested.
- Diagram specification SHA-256: `a5d08a705e604f8188b5fd6bc52d41b18b8b650a7b89d0a8eca8f8383d9f4b16`.
- Diagram HTML SHA-256: `5f7917fb0c1f0d66fcc7ba1b5d294e62461d95c14aac444a510ad38edce57608`.
- Root submodule pointer status: None; no submodule changed.

### 7. Human-only questions

- None. The requested continuation completed the existing Archify diagram refresh; no new diagram version or submodule change was needed.
