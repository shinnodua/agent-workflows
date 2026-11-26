# Security Role Workflow Research

## Metadata

- Research ID: `RESEARCH-20261126-security-role`
- Title: `Security role and artifact reviews`
- Type: `research`
- Status: `reviewed`
- Created: `2026-11-26`
- Last updated: `2026-11-26`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261126-security-role]`
- Source request: Add a domain-aware security role to sprint meetings and direct artifact reviews.
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

Add a reusable Security role, runtime agent definitions, and a security-review skill with command shims. Include Security in every sprint meeting. Keep review guidance in the role and orchestration in the skill.

## Short Version

The root workspace owns all affected files. CLI role registration must accompany documentation so init, update, sync, and model resolution recognize Security.

## Research Questions

- How are roles discovered, configured, and included in meetings?
- How can a developer request security review of research, PRDs, plans, or code?

## Context

This reusable package coordinates project-specific repositories. Its sample project profile cannot establish a real product domain; reviewers must load the consuming project's context and state missing facts.

## Current Workspace Findings

- Root workspace: `bin/workflows.js` maintains an explicit roleNames registry used for configuration validation, default migration, sync, and step model resolution.
- Agent discovery: `.agents/agents/`, `.claude/agents/`, and `roles/` contain five roles.
- Skills: commands and runtime shims delegate to `.agents/skills/`; package managed directories discover new files.
- Meetings: `.agents/skills/sprint-meeting/SKILL.md` and `templates/meeting-log-template.md` explicitly list five roles and UI/UX contributions.
- Related context: the role model configuration PRD and plan establish runtime-specific models and step overrides.
- Submodules: no product repository is affected.

## External Findings

None. This research concerns local workflow integration; no library trust or vulnerability claim is made.

## Reference URLs

None.

## Product Implications

- Users and use cases: developers request constructive security advice early or during implementation review.
- Goals: discover abuse, unauthorized access, disclosure, logic flaws, and dependency risk in product context.
- Non-goals or scope boundaries: penetration testing, automatic product patches, new approval gates, and certification.
- UX and workflow notes: retain existing invocation conventions and report actionable findings with uncertainty.

## Technical Implications

- Affected repositories: root workspace only.
- Shared contracts or data models: add security to the existing role/model registry.
- API/backend considerations: role guidance covers authorization and server trust boundaries.
- Web/client considerations: role guidance covers sensitive client data and untrusted input.
- App/runtime considerations: provide shared and Claude agent definitions and command shims.
- Security, privacy, or compliance notes: distinguish evidence from hypotheses; verify current library facts from primary sources when reviewing actual dependencies.
- Performance, reliability, or scalability notes: meeting roster must support bounded batches when runtime concurrency is limited.

## Options

- Documentation-only role: insufficient because the CLI rejects unknown roles.
- Registered role plus dedicated review skill: recommended; supports meetings and standalone review without duplicating guidance.

## Recommendation

Use role ID security and command security-review. Select the existing workflow step from the target artifact rather than introducing a new model-resolution step.

## Risks And Mitigations

- False confidence: record scope, evidence, coverage gaps, and unverified assumptions.
- Generic advice: require domain, actors, assets, trust boundaries, and realistic abuse scenarios.
- Upgrade regression: exercise migration and shim discovery in CLI integration tests.

## Highest-Risk Unknowns Or Clarifications Needed

None for implementation. Diagram refresh preference is requested separately and does not block role integration.

## Validation Ideas

- Test clean init and legacy config update, custom model preservation, model overrides, and both runtime agent formats.
- Run workspace:check and skill validation.

## Open Questions

None.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: role, skill/commands, meeting participation, CLI integration, documentation.
- Suggested affected platforms: root package only.
- Suggested acceptance criteria: discoverable role, working model resolution, six-role meetings, actionable domain-aware reviews.
- Suggested sequencing: approve requirements, implement registration and documents, validate installation and migration.
- Dependencies or decisions needed first: none.
