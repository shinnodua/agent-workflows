# Auto Mode Completion Handoff Research

## Metadata

- Research ID: `RESEARCH-20261001-auto-mode-completion-handoff`
- Title: `Auto Mode Completion Handoff`
- Type: `research`
- Status: `reviewed`
- Created: `2026-10-01`
- Last updated: `2026-10-01`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261001-auto-mode-completion-handoff]`
- Source request: `Require every coding agent's auto-mode completion summary to explain developer setup, build and runtime configuration, and breaking changes.`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

Auto mode currently ends with a short output contract listing artifacts, repositories, validation, and unresolved human questions. Implementation roles report dependencies and risks, but no shared final-summary template tells the coordinator how to convert those findings into concrete developer actions. Add a reusable template and require it in the auto-mode skill and implementation handoffs.

## Short Version

Use one final handoff with exact developer actions for source build and app, web, and API operation. State breaking changes and actions explicitly, including `None` when verified absent. Do not guess secrets or claim deployment was tested when only local validation ran.

## Research Questions

- Which current instructions own the auto-mode final report?
- What information must implementation agents return so the coordinator can report setup accurately?

## Context

This root repository distributes agent instructions to other projects. The feature changes reusable workflow guidance, not product code.

## Current Workspace Findings

- Root workspace: `.agents/skills/auto-mode/SKILL.md` defines the auto path and a brief output list; `workflows.md` describes validation and handoff; `AGENTS.md` gives workspace rules; roles and agent definitions define repository implementer handoffs. `templates/` contains research, PRD, plan, and meeting templates, but no completion template.
- Submodules: No configured example submodule needs a change for this reusable instruction.

## External Findings

- None. The requested behavior is internal to this workspace.

## Reference URLs

- None.

## Product Implications

- Users and use cases: A developer needs to know what to configure after auto-mode implementation to build the source and run the affected app, web, or API.
- Goals this may support: Reduce failed builds and hidden rollout work after agent completion.
- Non-goals or scope boundaries: No automatic deployment or secret creation.
- UX and workflow notes: The final summary should be skimmable and distinguish required actions from information already verified.

## Technical Implications

- Affected repositories: Root workspace only.
- Shared contracts or data models: None.
- API/backend considerations: Capture migrations, service settings, and compatibility when affected.
- Web/client considerations: Capture build-time variables, public endpoint configuration, and runtime settings when affected.
- App/runtime considerations: Capture platform configuration and environment values when affected.
- Security, privacy, or compliance notes: Name secret variables and destination, never secret values.
- Performance, reliability, or scalability notes: None.

## Options

- Option: Template plus mandatory auto-mode instruction
  - Summary: Create one reusable Markdown template and require all auto-mode coding handoffs to supply its fields.
  - Pros: Central, inspectable, and usable by serial or delegated implementers.
  - Cons: Agents must verify facts before filling fields.
  - When to choose: This request.

## Recommendation

Create `templates/auto-mode-completion-summary-template.md`, link it from auto-mode and repository implementer guidance, and require the coordinator to consolidate per-repository findings into the final report.

## Risks And Mitigations

- Risk: An agent infers external build-service settings without evidence.
  - Impact: Misleading setup instructions.
  - Mitigation: Separate verified steps from unknowns and state what the developer must determine.

## Highest-Risk Unknowns Or Clarifications Needed

- None. The user has named the expected categories and requested a reusable template.

## Validation Ideas

- Check the template covers build, runtime, breaking changes, migrations, validation, and exact developer actions.
- Run root workspace checks and confirm packaged files include the template.

## Open Questions

- None.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: Shared auto-mode final handoff contract.
- Suggested affected platforms: Root workspace.
- Suggested acceptance criteria: Every coding agent supplies facts; the final summary contains concrete required actions and explicit breaking-change status.
- Suggested sequencing: Template, instructions, validation.
- Dependencies or decisions needed first: None.
